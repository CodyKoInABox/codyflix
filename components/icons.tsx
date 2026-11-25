import type { ReactNode, SVGProps } from "react";

function Glyph(props: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export function PlayIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M6.5 4.8v14.4c0 .8.9 1.3 1.6.9l11.2-7.2c.7-.4.7-1.4 0-1.8L8.1 3.9c-.7-.4-1.6.1-1.6.9Z" />
    </Glyph>
  );
}

export function InfoIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="currentColor" d="M11 10.5h2V17h-2zM11 7h2v2h-2z" />
    </Glyph>
  );
}

export function PlusIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M11 5h2v14h-2zM5 11h14v2H5z" />
    </Glyph>
  );
}

export function CheckIcon() {
  return (
    <Glyph>
      <path fill="none" stroke="currentColor" strokeWidth="2.4" d="M5 12.5 9.2 17 19 7" />
    </Glyph>
  );
}

export function LikeIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M8 10.2V20H4.8A1.8 1.8 0 0 1 3 18.2v-6.1A1.8 1.8 0 0 1 4.8 10.2H8Zm2.1 9.8h6.3c.8 0 1.5-.5 1.7-1.2l1.8-6.1c.3-1-.4-2-1.4-2H14l.7-3.2c.2-.9-.4-1.7-1.3-1.9-.5-.1-1 .1-1.3.5L10.1 9.4c-.4.5-.6 1.1-.6 1.7v7.1c0 1 .8 1.8 1.6 1.8Z" />
    </Glyph>
  );
}

export function DislikeIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M16 13.8V4h3.2A1.8 1.8 0 0 1 21 5.8v6.1a1.8 1.8 0 0 1-1.8 1.9H16ZM13.9 4H7.6c-.8 0-1.5.5-1.7 1.2L4.1 11.3c-.3 1 .4 2 1.4 2H10l-.7 3.2c-.2.9.4 1.7 1.3 1.9.5.1 1-.1 1.3-.5l2.1-3.3c.4-.5.6-1.1.6-1.7V5.8c0-1-.8-1.8-1.7-1.8Z" />
    </Glyph>
  );
}

export function SearchIcon() {
  return (
    <Glyph>
      <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" d="m15 15 5 5" />
    </Glyph>
  );
}

export function CloseIcon() {
  return (
    <Glyph>
      <path stroke="currentColor" strokeWidth="2.2" d="M6 6l12 12M18 6 6 18" />
    </Glyph>
  );
}

export function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const rotate = direction === "left" ? "rotate(180 12 12)" : undefined;
  return (
    <Glyph>
      <path transform={rotate} fill="none" stroke="currentColor" strokeWidth="2.4" d="m9 5 7 7-7 7" />
    </Glyph>
  );
}

export function MuteIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M4 9h3.2L12 5.2v13.6L7.2 15H4V9Zm12.2.2 1.4 1.4-1.8 1.8 1.8 1.8-1.4 1.4-1.8-1.8-1.8 1.8-1.4-1.4 1.8-1.8-1.8-1.8 1.4-1.4 1.8 1.8 1.8-1.8Z" />
    </Glyph>
  );
}

export function VolumeIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M4 9h3.2L12 5.2v13.6L7.2 15H4V9Zm10.2 3a3.2 3.2 0 0 0-1.7-2.8v5.6A3.2 3.2 0 0 0 14.2 12Zm0-6.2v1.7A5.2 5.2 0 0 1 17.5 12a5.2 5.2 0 0 1-3.3 4.5v1.7A7 7 0 0 0 19.5 12a7 7 0 0 0-5.3-6.2Z" />
    </Glyph>
  );
}

export function ShareIcon() {
  return (
    <Glyph>
      <circle cx="7" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path stroke="currentColor" strokeWidth="1.8" d="m9 11 6-3M9 13l6 3" />
    </Glyph>
  );
}

export function PencilIcon() {
  return (
    <Glyph>
      <path fill="currentColor" d="M4 16.8V20h3.2l9.4-9.4-3.2-3.2L4 16.8Zm14.7-8.1a1 1 0 0 0 0-1.4l-1.9-1.9a1 1 0 0 0-1.4 0l-1.2 1.2 3.2 3.2 1.3-1.1Z" />
    </Glyph>
  );
}
