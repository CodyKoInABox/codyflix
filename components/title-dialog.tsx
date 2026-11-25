"use client";

import { useApp } from "@/components/app-state";
import { CloseIcon } from "@/components/icons";
import { TitleDetail } from "@/components/title-detail";
import { useModalDialog } from "@/components/use-dialog";

export function TitleDialog() {
  const { modalId, closeTitle, catalog } = useApp();
  const ref = useModalDialog(Boolean(modalId), closeTitle);
  const video = modalId ? catalog.videos.find((item) => item.id === modalId) : undefined;

  return (
    <dialog
      ref={ref}
      className="title-dialog"
      closedby="any"
      aria-labelledby={video ? "title-dialog-heading" : undefined}
      aria-label={video ? undefined : "Title details"}
    >
      <form method="dialog" className="dialog-close-form">
        <button type="submit" className="dialog-close" aria-label="Close" autoFocus>
          <CloseIcon />
        </button>
      </form>
      {video ? <TitleDetail video={video} mode="modal" /> : modalId ? <p className="dialog-missing">That title is not in this catalog.</p> : null}
    </dialog>
  );
}
