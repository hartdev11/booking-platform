import liff from "@line/liff";

let initDone = false;

export async function initializeLiff(liffId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (initDone) return;
  await liff.init({ liffId });
  initDone = true;
}

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
}

export async function getLiffProfile(): Promise<LiffProfile | null> {
  if (typeof window === "undefined") return null;
  if (!liff.isLoggedIn()) return null;
  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName ?? "",
    pictureUrl: profile.pictureUrl ?? "",
  };
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return liff.isLoggedIn();
}

export function login(): void {
  if (typeof window === "undefined") return;
  liff.login();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return liff.getAccessToken();
}
