import { useState, type RefObject } from 'react';

export const playtestEnabled = () => new URLSearchParams(window.location.search).get('playtest') === '1';

/** Local-session controls only. Commands feed the same movement/collision and campaign paths as the UI. */
export default function PlaytestConsole({ execute, readout }: {
  execute: RefObject<(command: string) => string>;
  readout: string;
}) {
  const [command, setCommand] = useState('walk forward 2');
  const [result, setResult] = useState('Ready. Commands never teleport or change stats.');
  return <details className="palace-playtest" open>
    <summary>Playtest controls · this session only</summary>
    <form onSubmit={event => { event.preventDefault(); setResult(execute.current(command)); }}>
      <label htmlFor="palace-command">Command</label>
      <div><input id="palace-command" value={command} onChange={event => setCommand(event.target.value)} autoComplete="off" spellCheck={false}/><button type="submit">Run</button></div>
    </form>
    <p role="status">{result}</p>
    <pre aria-label="Live palace telemetry">{readout}</pre>
    <p className="playtest-hint">walk forward 2 · run left 1 · turn 90 · look 20 · zoom 5 · jump · interact · stop · season · expire</p>
  </details>;
}
