import { useState, useSyncExternalStore } from 'react';
import CourtDialog from './CourtDialog';
import type { CampaignSaveStore } from '../persistence/campaignSave';
import {startingCareerTitle} from '../lib/careerAccess';
import {formatRank} from '../lib/courtStrategy';

export default function CampaignSaveControls({ store, onNewGame, onRecover, paused, onPauseChange, role=null, rank=null, season=1 }: {
  store: CampaignSaveStore; onNewGame: () => void; onRecover: () => void; paused: boolean; onPauseChange: (open: boolean) => void; role?:string|null; rank?:string|null; season?:number;
}) {
  const status = useSyncExternalStore(store.subscribe, store.getStatus, store.getStatus);
  const [confirm, setConfirm] = useState<'new' | 'recover' | null>(null);
  const close = () => { setConfirm(null); onPauseChange(false); };
  return <>
    <button className={`campaign-save-button ${status.problem ? 'save-problem' : ''}`} onClick={() => onPauseChange(true)} aria-label="Save and game options">{status.problem ? 'Save warning' : 'Save & game'}</button>
    {paused && <CourtDialog title="Save & game" onClose={close}>
      {role&&<p className="save-campaign-summary">{rank?formatRank(rank):startingCareerTitle(role)} · Season {season}</p>}
      <p role="status">{status.message}</p>
      {status.problem?<p className="save-explanation">{status.available ? "Your last save is protected. Play in this tab is currently unsaved." : "Closing or refreshing can lose progress since your last save."}</p>:<p className="save-explanation">{role?"Refresh resumes this campaign. Choose another path to start as Prince, Scholar or Concubine.":"Choose Prince, Scholar or Concubine to begin. Progress saves in this browser."}</p>}
      <details className="save-details"><summary>About saving</summary><p>Your campaign and season clock save in this browser. Message-gifts save when they finish; an interrupted gift is not charged twice. Clearing browser data removes local saves.</p></details>
      {confirm === 'new' ? <div className="save-confirmation">
        <h3>Choose a new path?</h3>
        <p>Your current campaign stays as a backup. A later new game replaces that backup.</p>
        <button className="save-primary" onClick={() => { onNewGame(); close(); }}>Keep backup & choose path</button>
        <button onClick={() => setConfirm(null)}>Cancel</button>
      </div> : confirm === 'recover' ? <div className="save-confirmation">
        <h3>Recover the previous campaign?</h3>
        <p>This replaces the campaign currently open. Your current saved campaign becomes the backup.</p>
        <button className="save-primary" onClick={() => { onRecover(); close(); }}>Recover previous campaign</button>
        <button onClick={() => setConfirm(null)}>Cancel</button>
      </div> : <div className="save-actions">
        <button onClick={() => setConfirm('new')}>Choose another path…</button>
        {status.hasPrevious && <button onClick={() => setConfirm('recover')}>Recover previous campaign…</button>}
        <button onClick={close}>Continue</button>
      </div>}
    </CourtDialog>}
    {status.problem && !paused && <p className="campaign-save-warning" role="status">{status.message}</p>}
  </>;
}
