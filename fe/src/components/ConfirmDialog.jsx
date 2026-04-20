import './ConfirmDialog.css';

/**
 * Small modal for destructive or irreversible actions.
 * confirmVariant: 'danger' = dark accent + white text; 'primary' = same as main CTA.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-dialog-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="confirm-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h2>
        <div className="confirm-dialog-body">{children}</div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'btn-danger-solid' : 'btn-primary'}
            onClick={() => {
              onConfirm?.();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
