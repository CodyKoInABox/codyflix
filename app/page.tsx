import { preload } from "react-dom";
import { HomeScreen } from "@/components/home-screen";
import { getCatalog } from "@/lib/catalog";
import { selectFeatured } from "@/lib/rows";
import { cardThumb } from "@/lib/thumbs";

export default function HomePage() {
  const catalog = getCatalog();
  const featured = selectFeatured(catalog.channels, catalog.videos);
  if (featured) {
    preload(cardThumb(featured), { as: "image", fetchPriority: "high" });
  }
  return <HomeScreen />;
}
