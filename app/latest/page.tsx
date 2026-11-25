import type { Metadata } from "next";
import { LatestScreen } from "@/components/browse-screen";

export const metadata: Metadata = {
  title: "Latest",
  description: "The newest uploads on Codyflix, ordered by publish date.",
};

export default function LatestPage() {
  return <LatestScreen />;
}
