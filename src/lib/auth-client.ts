"use client";

// (สำหรับ logout หรือกรณีอยากมี helper อื่น ๆ)

export async function signOut(opts?: { redirectTo?: string }) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (e) {
    console.warn("[signOut] logout failed", e);
  } finally {
    window.location.assign(opts?.redirectTo ?? "/sign-in");
  }
}
