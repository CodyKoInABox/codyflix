import { describe, expect, it } from "vitest";
import { addProfile, DEFAULT_PROFILE, deleteProfile, MAX_PROFILES, renameProfile, sanitizeName } from "@/lib/profiles";
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
    const profiles = [profile("a", "Cody"), profile("b", "Kelsey")];
    expect(renameProfile(profiles, "a", "Noel")[0]?.name).toBe("Noel");
    expect(renameProfile(profiles, "a", " ")).toEqual(profiles);
    expect(deleteProfile(profiles, "a")).toEqual([profile("b", "Kelsey")]);
    expect(deleteProfile(profiles, "missing")).toBe(profiles);
  });

  it("never deletes the last profile", () => {
    const only = [{ ...DEFAULT_PROFILE }];
    expect(deleteProfile(only, DEFAULT_PROFILE.id)).toBe(only);
  });

  it("defines Default as the entry profile", () => {
    expect(DEFAULT_PROFILE).toEqual({ id: "default", name: "Default", avatar: "ember" });
  });
});
