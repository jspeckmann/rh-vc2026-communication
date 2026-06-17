import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null);
  const prevFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
      dialogRef.current?.focus();
    }
    return () => {
      prevFocusRef.current?.focus();
      prevFocusRef.current = null;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-1000 flex items-center justify-center transition-opacity duration-200 ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-lg bg-[var(--color-content)] p-6 shadow-lg outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={`${title} schliessen`}
            className="cursor-pointer text-xl leading-none text-[var(--color-gray)] hover:text-[var(--color-fg)]"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
