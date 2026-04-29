type NoticeDialogProps = {
  open: boolean;
  title: string;
  description: string;
  buttonLabel: string;
  onClose: () => void;
};

export function NoticeDialog({ open, title, description, buttonLabel, onClose }: NoticeDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-card notice-card" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <p className="hero-copy">{description}</p>
        <div className="modal-actions">
          <button className="action-button" onClick={onClose}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
