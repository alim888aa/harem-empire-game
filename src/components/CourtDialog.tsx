// Owns native modal focus/close behavior and the shared heading/body scroll boundary.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { playCue } from "../ui";

type CourtDialogProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function CourtDialog({ title, onClose, children }: CourtDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Native modal supplies focus containment, inert background, and Escape handling.
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    playCue("scroll");
    return () => {
      element?.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="court-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" autoFocus onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </div>
        <div className="dialog-body" role="region" aria-label={`${title} content`} tabIndex={0}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
