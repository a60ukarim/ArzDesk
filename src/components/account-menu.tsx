"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Settings2, ChevronRight, X, Download } from "lucide-react";
import { SignOut } from "./sign-out";

export function AccountMenu({
  person,
}: {
  person: { name: string; email: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  function close() {
    dialog.current?.close();
  }
  const initials = Array.from(person.name.trim())
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <>
      <button
        className="account-trigger"
        type="button"
        aria-label="Open account menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="account-trigger-name" dir="auto">
          {person.name}
        </span>
      </button>
      <dialog
        id={id}
        ref={dialog}
        className="account-drawer"
        aria-labelledby={`${id}-title`}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          const b = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < b.left ||
            e.clientX > b.right ||
            e.clientY < b.top ||
            e.clientY > b.bottom
          )
            close();
        }}
      >
        <div className="account-drawer-top">
          <h2 id={`${id}-title`}>Your account</h2>
          <button
            type="button"
            className="drawer-close"
            aria-label="Close account menu"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        <div className="drawer-person">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <strong dir="auto">{person.name}</strong>
          <span>{person.email}</span>
        </div>
        <nav aria-label="Account actions">
          <Link
            href="/profile"
            className="drawer-settings"
            onClick={() => {
              if (window.location.pathname !== "/profile") {
                try {
                  sessionStorage.setItem(
                    "arzdesk-account-return",
                    window.location.pathname +
                      window.location.search +
                      window.location.hash,
                  );
                } catch {}
              }
              close();
            }}
          >
            <Settings2 size={21} />
            <span>
              <strong>Settings</strong>
              <small>Name, email &amp; password</small>
            </span>
            <ChevronRight size={17} />
          </Link>
          <Link href="/install" className="drawer-install" onClick={close}>
            <Download size={18} />
            Install ArzDesk
          </Link>
        </nav>
        <div className="drawer-logout">
          <SignOut />
          <p>Log out on this browser.</p>
        </div>
        <p className="drawer-footer">ArzDesk · by ArzCore</p>
      </dialog>
    </>
  );
}
