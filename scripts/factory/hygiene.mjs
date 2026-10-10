// Owns selected source-debt counts; never substitutes for full lint/dead-code tooling.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = process.env.FACTORY_HYGIENE_ROOT
  ? new URL(`${path.resolve(process.env.FACTORY_HYGIENE_ROOT)}/`, 'file:')
  : new URL('../../', import.meta.url);
const baselineUrl = new URL('docs/factory/hygiene-baseline.json', root);
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const children = await Promise.all(entries.map(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : /\.tsx?$/.test(file) ? [file] : [];
  }));
  return children.flat();
}

const counts = { explicitAny: 0, alerts: 0, consoleLogs: 0, unseededRandom: 0, longLines: 0, oversizedFiles: 0 };
for (const file of await files(fileURLToPath(new URL('src/', root)))) {
  const source = await readFile(file, 'utf8');
  const lines = source.split('\n');
  counts.longLines += lines.filter(line => line.length > 140).length;
  if (lines.length > 300) counts.oversizedFiles++;
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) counts.explicitAny++;
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText(syntax);
      if (name === 'alert' || name === 'window.alert') counts.alerts++;
      if (name === 'console.log') counts.consoleLogs++;
      if (name === 'Math.random') counts.unseededRandom++;
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
}

if (process.argv.includes('--baseline')) {
  await writeFile(baselineUrl, `${JSON.stringify(counts, null, 2)}\n`);
} else {
  const baseline = JSON.parse(await readFile(baselineUrl, 'utf8'));
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline) ||
      Object.keys(counts).some(rule => !Number.isSafeInteger(baseline[rule]) || baseline[rule] < 0)) {
    throw new Error('Hygiene baseline requires a nonnegative integer for every measured rule.');
  }
  const increased = Object.entries(counts).filter(([rule, count]) => count > baseline[rule]);
  if (increased.length) {
    process.stderr.write(`Source debt increased: ${JSON.stringify(increased)}\n`);
    process.exitCode = 1;
  }
}
process.stdout.write(`${JSON.stringify(counts)}\n`);
