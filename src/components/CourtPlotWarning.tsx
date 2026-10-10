/** The same actionable plot details appear in the court report and notifications. */
import {safePlotInfluencePercent, type CourtPlot} from '../lib/courtPlots';
import {PLAYER_NODE, type CourtGraph} from '../lib/courtGraph';

export type CourtPlotWarningContext = {
  graph?: CourtGraph;
  influence: number;
  influences: Record<string, number>;
  joinableFactions?: readonly string[];
};
export default function CourtPlotWarning({
  plot, graph, influence, influences, joinableFactions = [],
}: CourtPlotWarningContext & {plot: CourtPlot}) {
  const rivalTarget = plot.target && plot.target !== PLAYER_NODE ? plot.target : null;
  return <>
    <strong>{plot.attacker} is plotting against {rivalTarget ?? 'you'}</strong>
    <p>Next attempt: start of season {plot.dueSeason}. Review before ending the season.</p>
    {rivalTarget ? <>
      <p>Romantic rivals share an accepted lover; 80 hate and greater influence permit an assassination warning.</p>
      <p>The target’s living direct pledged courtiers can shield them. With no protector, the rival dies permanently.
        Ending the shared romance removes the motive.</p>
    </> : <>
      <p>Reach {safePlotInfluencePercent(influences[plot.attacker] ?? 0)}% influence to be safe.
        Yours: {(Math.floor(influence * 1000) / 10).toFixed(1)}%.</p>
      <p>One ally dies each season until you exceed this enemy’s influence. A tie is not safe. With no allies left, you die.</p>
      <details><summary>Other ways to stop this plot</summary>
        <p>Secure their pledge.{graph && !graph.nodes[PLAYER_NODE].faction &&
          joinableFactions.includes(graph.nodes[plot.attacker]?.faction ?? '') ?
          ' Accepting their faction invitation also defuses the plot.' : ''}</p>
      </details>
    </>}
  </>;
}
