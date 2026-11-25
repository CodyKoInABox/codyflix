import { describe, expect, it } from "vitest";
import { addProfile, deleteProfile, MAX_PROFILES, renameProfile, sanitizeName } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

function profile(id: string, name = `Person ${id}`): Profile {
  return { id, name, avatar: "ocean" };
}

describe("profiles", () => {
  it("caps the roster at five and rejects a blank name", () => {
    let profiles: Profile[] = [];
    for (let index = 0; index < MAX_PROFILES + 2; index += 1) {
      profiles = addProfile(profiles, profile(String(index)));
    }
    expect(profiles).toHaveLength(MAX_PROFILES);
    expect(addProfile(profiles, { id: "blank", name: "   ", avatar: "sun" })).toEqual(profiles);
  });

  it("trims names and falls back to a known avatar", () => {
    const profiles = addProfile([], { id: "a", name: "  Cody   Ko  extra name that is long", avatar: "nope" });
    expect(profiles[0]?.name).toBe(sanitizeName("  Cody   Ko  extra name that is long"));
    expect(profiles[0]?.name.length).toBeLessThanOrEqual(18);
    expect(profiles[0]?.avatar).toBe("ember");
  });

  it("renames and deletes", () => {
    const profiles = [profile("a", "Cody")];
    expect(renameProfile(profiles, "a", "Kelsey")[0]?.name).toBe("Kelsey");
    expect(renameProfile(profiles, "a", " ")).toEqual(profiles);
    expect(deleteProfile(profiles, "a")).toEqual([]);
  });
});
