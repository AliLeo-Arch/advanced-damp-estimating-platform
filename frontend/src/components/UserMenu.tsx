import { useEffect, useId, useRef, useState } from "react";
import type { AuthUser } from "../auth";

const FIELD_MODE_KEY = "teq.fieldMode";

type UserMenuProps = {
  user: AuthUser;
  onSignOut: () => void;
};

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export function getFieldModeEnabled() {
  try {
    return localStorage.getItem(FIELD_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [fieldMode, setFieldMode] = useState(() => getFieldModeEnabled());
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
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleFieldMode() {
    const next = !fieldMode;
    setFieldMode(next);
    try {
      localStorage.setItem(FIELD_MODE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("teq-field-mode-change"));
  }

  return (
    <div className={`user-menu${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="user-menu-avatar" aria-hidden>
          {user.full_name.trim().charAt(0).toUpperCase() || "U"}
        </span>
        <span className="user-menu-copy">
          <span className="user-menu-name">{user.full_name}</span>
          <span className="user-menu-role">{roleLabel(user.role)}</span>
        </span>
      </button>
      {open ? (
        <div className="user-menu-panel" role="menu" id={menuId}>
          <div className="user-menu-meta">
            <strong>{user.full_name}</strong>
            <span>{user.email}</span>
            <span className="user-menu-role-pill">{roleLabel(user.role)}</span>
          </div>
          <button
            type="button"
            className="user-menu-item"
            role="menuitem"
            aria-checked={fieldMode}
            onClick={toggleFieldMode}
          >
            {fieldMode ? "Field mode: On" : "Field mode: Off"}
          </button>
          <button
            type="button"
            className="user-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
