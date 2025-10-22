// src/components/site/site-footer.tsx

import Link from "next/link";
import SiteLogo from "./site-logo";

/**
 * Footer ส่วนล่างของไซต์:
 * - แบรนด์ + คำอธิบายย่อ
 * - ลิงก์นโยบาย/ข้อกำหนด/ติดต่อ
 * - ลิขสิทธิ์พร้อมปีแสดงผล (รองรับช่วงปี เช่น 2024-2026)
 *
 * หมายเหตุ:
 * - ใช้ role="contentinfo" บน <footer> เหมาะสมแล้ว
 * - <time dateTime> ใช้เป็นปีปัจจุบันเพื่อถูกต้องตามสเปค
 */
export default function SiteFooter() {
  const startYear = 2024;
  const thisYear = new Date().getFullYear();
  const yearText =
    startYear === thisYear ? `${thisYear}` : `${startYear}-${thisYear}`;

  return (
    <footer role="contentinfo" className="border-t bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl text-center">
          {/* Brand — ใช้ Link ห่อ SiteLogo (SiteLogo ควรไม่ render <a> ซ้ำ) */}
          <Link
            href="/"
            className="mb-4 inline-flex items-center justify-center gap-2"
            prefetch={false}
            aria-label="ไปหน้าแรก MonkPad"
          >
            <SiteLogo href={null} />
          </Link>

          <p className="text-pretty text-muted-foreground mb-6">
            จัดการรายรับรายจ่ายด้วยเทคโนโลยี OCR อัตโนมัติ
          </p>

          {/* Footer nav */}
          <nav aria-label="ลิงก์ส่วนท้าย" className="flex justify-center">
            <ul
              role="list"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-foreground"
                  prefetch={false}
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-foreground"
                  prefetch={false}
                >
                  ข้อกำหนดการใช้งาน
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-foreground"
                  prefetch={false}
                >
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </nav>

          {/* ลิขสิทธิ์ */}
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              © <time dateTime={`${thisYear}`}>{yearText}</time> MonkPad.
              สงวนลิขสิทธิ์ทุกประการ.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
