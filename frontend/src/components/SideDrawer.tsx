import { ReactNode, useEffect, useId, useRef } from "react";

type SideDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export default function SideDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: SideDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="side-drawer-root" role="presentation">
      <button
        type="button"
        className="side-drawer-backdrop"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className={`side-drawer${wide ? " is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="side-drawer-header">
          <div>
            <h2 className="side-drawer-title" id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className="side-drawer-subtitle">{subtitle}</p> : null}
          </div>
          <button
            className="btn btn-ghost btn-compact"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="side-drawer-body">{children}</div>
      </aside>
    </div>
  );
}
