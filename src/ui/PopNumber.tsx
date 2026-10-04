/**
 * A number that reacts when it changes: it briefly glows, and the difference
 * ("+5") floats up and fades away. Increases can also play a sound cue.
 */
import { useEffect, useRef, useState } from 'react';
import { playCue, type Cue } from './sound';

const FLOAT_MS = 1400;

export default function PopNumber({ value, format = String, cueOnGain }: { value: number; format?: (value: number) => string; cueOnGain?: Cue }) {
  const previous = useRef(value);
  const [deltas, setDeltas] = useState<Array<{ id: number; amount: number }>>([]);
  useEffect(() => {
    const amount = value - previous.current;
    previous.current = value;
    if (!amount) return;
    const id = Date.now() + Math.random();
    setDeltas(list => [...list.slice(-2), { id, amount }]);
    if (amount > 0 && cueOnGain) playCue(cueOnGain);
    const timer = setTimeout(() => setDeltas(list => list.filter(delta => delta.id !== id)), FLOAT_MS);
    return () => clearTimeout(timer);
  }, [value]);
  const last = deltas.at(-1);
  return <span className="ui-pop" data-change={last ? (last.amount > 0 ? 'gain' : 'loss') : undefined}>
    <span key={last?.id ?? 'steady'} className="ui-pop-value">{format(value)}</span>
    {deltas.map(delta => <span key={delta.id} className={`ui-pop-delta ${delta.amount > 0 ? 'is-gain' : 'is-loss'}`} aria-hidden="true">
      {delta.amount > 0 ? '+' : '−'}{format(Math.abs(delta.amount))}
    </span>)}
  </span>;
}
