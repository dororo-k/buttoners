'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Size = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  desc?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  size?: Size;
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const sizeToMaxWidth: Record<Size, string> = {
  sm: 'max-w-[360px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  desc,
  actions,
  children,
  size = 'md',
  initialFocusRef,
  closeOnBackdrop = true,
  showCloseButton = true,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const focusTarget =
      initialFocusRef?.current ??
      panelRef.current?.querySelector(FOCUSABLE_SELECTOR) ??
      closeBtnRef.current ??
      panelRef.current;
    (focusTarget as HTMLElement | null)?.focus?.();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    if (focusables.length === 0) {
      e.preventDefault();
      (root as HTMLElement).focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === overlayRef.current) onClose();
  };

  if (!isMounted || !open) return null;

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onBackdropClick} aria-hidden={false}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={desc ? descId : undefined}
        className={[
          'relative z-10 w-full',
          sizeToMaxWidth[size],
          'rounded-2xl border border-border bg-panel shadow-xl',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand',
          'transition-transform',
          className,
        ].join(' ')}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={e => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-4">
            {title ? <h2 id={titleId} className="text-[16px] font-semibold leading-6 text-ink">{title}</h2> : <span aria-hidden className="sr-only">Dialog</span>}
            {showCloseButton && (
              <button ref={closeBtnRef} type="button" onClick={onClose} aria-label="Close" className="btn-ghost -mr-2">X</button>
            )}
          </div>
        )}
        {desc && <p id={descId} className="px-5 pt-2 text-[13px] text-muted">{desc}</p>}
        <div className="px-5 py-4">{children}</div>
        {actions && <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">{actions}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
