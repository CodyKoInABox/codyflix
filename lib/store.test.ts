import { describe, expect, it } from "vitest";
import { normalizeStore } from "@/lib/store";

describe("normalizeStore", () => {
  it("drops corrupt profiles, unknown reactions, and fake durations", () => {
    const store = normalizeStore({
      profiles: [
        { id: "1", name: "  Cody  ", avatar: "ocean" },
        { id: "1", name: "Duplicate", avatar: "sun" },
        { id: "", name: "Nope", avatar: "sun" },
        { id: "2", name: "   ", avatar: "sun" },
        { name: "Missing id" },
      ],
      activeProfileId: "missing",
      libraries: {
        "1": {
          list: ["abc", "abc", 4],
          likes: { abc: "like", def: "love", ghi: "dislike" },
          progress: {
            abc: { videoId: "abc", positionSeconds: 4, durationSeconds: 0, updatedAt: 9, started: true },
          },
          lastPlayedVideoId: "abc",
        },
      },
    });

    expect(store.profiles).toEqual([{ id: "1", name: "Cody", avatar: "ocean" }]);
    expect(store.activeProfileId).toBeNull();
    expect(store.libraries["1"]?.list).toEqual(["abc"]);
    expect(store.libraries["1"]?.likes).toEqual({ abc: "like", ghi: "dislike" });
    expect(store.libraries["1"]?.progress.abc).not.toHaveProperty("durationSeconds");
    expect(store.libraries["1"]?.lastPlayedVideoId).toBe("abc");
  });

  it("returns an empty store for junk", () => {
    expect(normalizeStore(null)).toEqual({ profiles: [], activeProfileId: null, libraries: {} });
  });
});
