import { useEffect, useRef, type ReactNode } from "react";

export default function CourtDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Native modal supplies focus containment, inert background, and Escape handling.
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="court-dialog" aria-label={title}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-content">
      <div className="dialog-heading"><h2>{title}</h2><button autoFocus onClick={onClose} aria-label={`Close ${title}`}>×</button></div>
      {children}
    </div>
  </dialog>;
}
