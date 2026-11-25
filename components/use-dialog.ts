"use client";

import { useEffect, useEffectEvent, useRef } from "react";

export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();

    const handleClose = () => close();
    node.addEventListener("close", handleClose);

    let pressedOutside = false;
    const outside = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    const onDown = (event: PointerEvent) => {
      pressedOutside = outside(event);
    };
    const onUp = (event: PointerEvent) => {
      if (!("closedBy" in HTMLDialogElement.prototype) && pressedOutside && outside(event)) node.close();
    };
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointerup", onUp);

    return () => {
      node.removeEventListener("close", handleClose);
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointerup", onUp);
      if (node.open) node.close();
    };
  }, [open]);

  return ref;
}
