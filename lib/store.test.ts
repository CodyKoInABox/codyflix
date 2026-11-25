import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyStore, ensureDefaultProfile, GATE_BOOT_SCRIPT, normalizeStore, readLiveStore, STORAGE_KEY } from "@/lib/store";

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

const SEEDED = {
  profiles: [{ id: "default", name: "Default", avatar: "ember" }],
  activeProfileId: "default",
  libraries: { default: { list: [], likes: {}, progress: {} } },
};

const TWO_PROFILES = {
  profiles: [
    { id: "default", name: "Default", avatar: "ember" },
    { id: "k", name: "Kelsey", avatar: "rose" },
  ],
  activeProfileId: null,
  libraries: {},
};

function memoryStorage(raw?: string) {
  const data = new Map<string, string>(raw === undefined ? [] : [[STORAGE_KEY, raw]]);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

const blockedStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("SecurityError");
  },
};

describe("ensureDefaultProfile", () => {
  it("creates Default and selects it when there are no profiles", () => {
    expect(ensureDefaultProfile(emptyStore())).toEqual(SEEDED);
  });

  it("leaves existing profiles alone, including a null active id", () => {
    const store = normalizeStore(TWO_PROFILES);
    expect(ensureDefaultProfile(store)).toBe(store);
    expect(store.activeProfileId).toBeNull();
  });

  it("keeps a profile that is already active", () => {
    const store = normalizeStore({ ...TWO_PROFILES, activeProfileId: "k" });
    expect(ensureDefaultProfile(store).activeProfileId).toBe("k");
  });
});

describe("readLiveStore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes Default into empty storage on hydration", () => {
    const storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
    const store = readLiveStore();
    expect(store).toMatchObject({ ...SEEDED, hydrated: true });
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? "null")).toEqual(SEEDED);
    expect(readLiveStore()).toBe(store);
  });

  it("does not pick a profile when profiles exist and none is active", () => {
    const raw = JSON.stringify(TWO_PROFILES);
    const storage = memoryStorage(raw);
    vi.stubGlobal("window", { localStorage: storage });
    expect(readLiveStore().activeProfileId).toBeNull();
    expect(storage.data.get(STORAGE_KEY)).toBe(raw);
  });

  it("still enters as Default when storage is blocked", () => {
    vi.stubGlobal("window", { localStorage: blockedStorage });
    expect(readLiveStore()).toMatchObject({ ...SEEDED, hydrated: true });
  });
});

describe("GATE_BOOT_SCRIPT", () => {
  function boot(localStorage: unknown): string | undefined {
    const documentElement = { dataset: {} as Record<string, string> };
    new Function("localStorage", "document", GATE_BOOT_SCRIPT)(localStorage, { documentElement });
    return documentElement.dataset.gate;
  }

  it("seeds Default before paint and keeps the gate closed on a first visit", () => {
    const storage = memoryStorage();
    expect(boot(storage)).toBe("app");
    const saved = JSON.parse(storage.data.get(STORAGE_KEY) ?? "null");
    expect(saved).toEqual(SEEDED);
    expect(normalizeStore(saved)).toEqual(ensureDefaultProfile(emptyStore()));
  });

  it("seeds over corrupt JSON", () => {
    const storage = memoryStorage("{");
    expect(boot(storage)).toBe("app");
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? "null")).toEqual(SEEDED);
  });

  it("seeds when every saved profile is one normalizeStore would drop", () => {
    const junk = { profiles: [{ id: "", name: "x" }, { id: "y", name: "  " }, "z"], activeProfileId: "y" };
    expect(normalizeStore(junk).profiles).toEqual([]);
    const storage = memoryStorage(JSON.stringify(junk));
    expect(boot(storage)).toBe("app");
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? "null")).toEqual(SEEDED);
  });

  it("opens the gate for Switch profile without touching storage", () => {
    const raw = JSON.stringify(TWO_PROFILES);
    const storage = memoryStorage(raw);
    expect(boot(storage)).toBe("open");
    expect(storage.data.get(STORAGE_KEY)).toBe(raw);
  });

  it("enters the app when the saved active profile exists", () => {
    expect(boot(memoryStorage(JSON.stringify({ ...TWO_PROFILES, activeProfileId: "k" })))).toBe("app");
    expect(boot(memoryStorage(JSON.stringify({ ...TWO_PROFILES, activeProfileId: "gone" })))).toBe("open");
  });

  it("does not show the gate when storage is blocked", () => {
    expect(boot(blockedStorage)).toBe("app");
  });
});
