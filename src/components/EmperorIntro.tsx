interface Props {arrived:boolean;loading:boolean;error:boolean;onRetry?:()=>void;onContinue:()=>void}
/** A presentation-only first visit. No tribute, answers, rewards or season change. */
export default function EmperorIntro({arrived,loading,error,onRetry,onContinue}:Props){
  return <div className="emperor-intro">
    <p className="intro-eyebrow">A first imperial visit</p>
    <h1>{error?'The Emperor’s character couldn’t load':arrived?'The Emperor surveys the court':loading?'Preparing the Emperor’s arrival':'The Emperor approaches'}</h1>
    <p>{error?'Your campaign is safe. You can retry his arrival or return to exploring.':loading?'Loading the Emperor’s character. Your season clock is paused.':'He has come to observe the court. No tribute is required for this visit.'}</p>
    {error&&<button onClick={onRetry}>Retry Emperor</button>}
    {(arrived||error)&&<button onClick={onContinue}>Return to the court</button>}
  </div>;
}
