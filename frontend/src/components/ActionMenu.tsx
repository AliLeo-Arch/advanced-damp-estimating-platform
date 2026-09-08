import { useEffect, useId, useRef, useState } from "react";

export type ActionMenuItem = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
};

type ActionMenuProps = {
  label?: string;
  items: ActionMenuItem[];
  disabled?: boolean;
  compact?: boolean;
};

export default function ActionMenu({
  label = "More",
  items,
  disabled = false,
  compact = false,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!items.length) return null;

  return (
    <div className={`action-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        className={`btn btn-secondary${compact ? " btn-compact" : ""}`}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <span className="action-menu-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <ul className="action-menu-list" id={menuId} role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={`action-menu-item${item.tone === "danger" ? " is-danger" : ""}`}
                disabled={item.disabled || disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
