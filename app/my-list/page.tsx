import type { Metadata } from "next";
import { MyListScreen } from "@/components/my-list-screen";

export const metadata: Metadata = {
  title: "My List",
  description: "Titles you saved on this device.",
};

export default function MyListPage() {
  return <MyListScreen />;
}
