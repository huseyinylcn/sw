import { useEffect } from 'react'
import './Modal.css'

function Modal({ open, onClose, title, description, children }) {
  useEffect(() => {
    if (!open) return

    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__heading">
            <h3 className="modal__title">{title}</h3>
            {description && <p className="modal__description">{description}</p>}
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
