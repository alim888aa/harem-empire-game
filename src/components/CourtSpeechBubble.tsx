export default function CourtSpeechBubble({name,response,anchored=false,children}:{name:string;response:string;anchored?:boolean;children?:React.ReactNode}){
 const text=response.startsWith(`${name}:`)?response.slice(name.length+1).trim():response;
 return <section className={`court-speech ${anchored?'speech-accessible-copy':''}`} role="status" aria-live="polite" aria-atomic="true"><strong>{name}</strong><p>{text||'What would you like to talk about?'}</p>{children}</section>;
}
