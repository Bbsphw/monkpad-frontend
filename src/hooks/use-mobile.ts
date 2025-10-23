// src/hooks/use-mobile.ts

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook สำหรับตรวจว่า viewport ปัจจุบันอยู่ในช่วง mobile หรือไม่
 * - ใช้ `window.matchMedia`
 * - ปลอดภัยต่อ SSR (Next.js)
 * - Cleanup event listener ทุกครั้ง
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // ป้องกันตอน SSR ที่ไม่มี window
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // ตั้งค่าครั้งแรก
    setIsMobile(mql.matches);

    // อัปเดตเมื่อมีการเปลี่ยนขนาดหน้าจอ
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}
