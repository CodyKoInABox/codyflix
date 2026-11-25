import type { Metadata } from "next";
import { Suspense } from "react";
import { RememberSearchOrigin, SearchScreen } from "@/components/search-screen";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Codyflix titles, channels, and descriptions.",
};

export default function SearchPage() {
  return (
    <>
      <RememberSearchOrigin />
      <Suspense
        fallback={
          <div className="page">
            <h1>Search</h1>
          </div>
        }
      >
        <SearchScreen />
      </Suspense>
    </>
  );
}
