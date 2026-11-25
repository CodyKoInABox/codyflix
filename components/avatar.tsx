import { avatarStyle } from "@/lib/profiles";

export function Avatar({ name, avatar, className = "" }: { name: string; avatar: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "C";
  return (
    <span className={`avatar ${className}`} style={{ background: avatarStyle(avatar) }} aria-hidden="true">
      {initial}
    </span>
  );
}
