import type {DemotionNotice} from '../lib/demotionNotice';
import {demotionReason} from '../lib/demotionNotice';
import {formatRank} from '../lib/courtStrategy';
export default function DemotionSummary({notice}:{notice:DemotionNotice}){
 return <section className="demotion-summary" aria-label="Rank demotion"><strong>{formatRank(notice.fromRank)} → {formatRank(notice.toRank)}</strong><p>{demotionReason(notice)} Rebuild during your two-season probation.</p></section>;
}
