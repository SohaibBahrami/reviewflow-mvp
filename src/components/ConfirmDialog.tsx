interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, danger = false, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-icon" aria-hidden="true">{danger ? '!' : '↗'}</div>
        <p className="eyebrow">Please confirm</p>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-description" className="confirm-dialog-copy">{description}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? 'button button-danger' : 'button button-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
