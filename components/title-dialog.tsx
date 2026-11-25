"use client";

import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useApp } from "@/components/app-state";
import { CloseIcon } from "@/components/icons";
import { TitleDetail } from "@/components/title-detail";

const CLOSE_MS = 220;

const TITLE_DIALOG_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .title-dialog[open] { animation: title-dialog-in 280ms cubic-bezier(0.2, 0.8, 0.2, 1); }
  .title-dialog[open]::backdrop { animation: title-dialog-fade-in 280ms ease-out; }
  .title-dialog[open][data-closing] { animation: title-dialog-out ${CLOSE_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards; }
  .title-dialog[open][data-closing]::backdrop { animation: title-dialog-fade-out ${CLOSE_MS}ms ease-in forwards; }
}
.title-dialog[data-closing] { pointer-events: none; }
@keyframes title-dialog-in { from { opacity: 0; transform: translateY(28px) scale(0.94); } }
@keyframes title-dialog-out { to { opacity: 0; transform: translateY(20px) scale(0.95); } }
@keyframes title-dialog-fade-in { from { opacity: 0; } }
@keyframes title-dialog-fade-out { to { opacity: 0; } }
`;

export function TitleDialog() {
  const { modalId, closeTitle, catalog } = useApp();
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [shownId, setShownId] = useState(modalId);
  if (modalId && modalId !== shownId) setShownId(modalId);
  const video = shownId ? catalog.videos.find((item) => item.id === shownId) : undefined;
  const requestClose = useEffectEvent(() => closeTitle());

  useEffect(() => {
    requestClose();
  }, [pathname]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (modalId) {
      delete node.dataset.closing;
      if (!node.open) node.showModal();
      return;
    }
    if (!node.open) return;
    node.dataset.closing = "";
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      delete node.dataset.closing;
      node.close();
      setShownId(null);
    };
    const onEnd = (event: AnimationEvent) => {
      if (event.target === node) finish();
    };
    node.addEventListener("animationend", onEnd);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(finish, reduce ? 0 : CLOSE_MS + 80);
    return () => {
      node.removeEventListener("animationend", onEnd);
      window.clearTimeout(timer);
      if (!finished) delete node.dataset.closing;
    };
  }, [modalId]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      requestClose();
    };
    const onClose = () => requestClose();
    let pressedOutside = false;
    const outside = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    const onDown = (event: PointerEvent) => {
      pressedOutside = outside(event);
    };
    const onUp = (event: PointerEvent) => {
      if (pressedOutside && outside(event)) requestClose();
      pressedOutside = false;
    };
    node.addEventListener("cancel", onCancel);
    node.addEventListener("keydown", onKey);
    node.addEventListener("close", onClose);
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointerup", onUp);
    return () => {
      node.removeEventListener("cancel", onCancel);
      node.removeEventListener("keydown", onKey);
      node.removeEventListener("close", onClose);
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointerup", onUp);
      if (node.open) node.close();
    };
  }, []);

  const previousId = useRef<string | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !shownId) {
      previousId.current = shownId;
      return;
    }
    node.scrollTo({ top: 0 });
    if (previousId.current && previousId.current !== shownId) {
      node.querySelector<HTMLElement>("#title-dialog-heading")?.focus({ preventScroll: true });
    }
    previousId.current = shownId;
  }, [shownId]);

  return (
    <dialog
      ref={ref}
      className="title-dialog"
      closedby="none"
      aria-labelledby={video ? "title-dialog-heading" : undefined}
      aria-label={video ? undefined : "Title details"}
    >
      <style href="codyflix-title-dialog" precedence="default">
        {TITLE_DIALOG_CSS}
      </style>
      <div className="dialog-close-form">
        <button type="button" className="dialog-close" aria-label="Close" autoFocus onClick={closeTitle}>
          <CloseIcon />
        </button>
      </div>
      {video ? <TitleDetail video={video} /> : shownId ? <p className="dialog-missing">That title is not in this catalog.</p> : null}
    </dialog>
  );
}
