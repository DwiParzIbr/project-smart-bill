import { describe, it, expect, beforeEach } from "vitest";
import { getUserProfile, saveUserProfile, getHostPaymentProfile } from "@/lib/storage/bill-storage";
import { UserProfile } from "@/lib/types/user";

describe("User Identity & Profile Storage", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const mockLocalStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };
    (globalThis as any).window = {};
    (globalThis as any).localStorage = mockLocalStorage;
  });

  it("returns null when no profile has been saved", () => {
    expect(getUserProfile()).toBeNull();
  });

  it("saves and retrieves user profile successfully", () => {
    const mockProfile: UserProfile = {
      name: "Dwi Fariz",
      phone: "08123456789",
      email: "dwifariz@example.com",
      avatarColor: "from-indigo-600 to-violet-500",
      bio: "Suka makan bareng kawan",
      createdAt: "2026-11-02T10:00:00Z",
      updatedAt: "2026-11-02T10:00:00Z",
      isCloudSynced: false,
    };

    saveUserProfile(mockProfile);

    const saved = getUserProfile();
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe("Dwi Fariz");
    expect(saved?.phone).toBe("08123456789");
    expect(saved?.email).toBe("dwifariz@example.com");
    expect(saved?.avatarColor).toBe("from-indigo-600 to-violet-500");
  });

  it("automatically synchronizes host payment profile name when saved", () => {
    const mockProfile: UserProfile = {
      name: "Budi Santoso",
      avatarColor: "from-sky-600 to-cyan-500",
      createdAt: "2026-11-02T10:00:00Z",
      updatedAt: "2026-11-02T10:00:00Z",
    };

    saveUserProfile(mockProfile);

    const paymentProfile = getHostPaymentProfile();
    expect(paymentProfile).not.toBeNull();
    expect(paymentProfile?.hostName).toBe("Budi Santoso");
  });
});
