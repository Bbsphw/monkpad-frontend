// components/site-footer.tsx
import Link from "next/link";
import SiteLogo from "./site-logo";

export default function SiteFooter() {
  const startYear = 2024;
  const thisYear = new Date().getFullYear();
  const yearText =
    startYear === thisYear ? `${thisYear}` : `${startYear}-${thisYear}`;

  return (
    <footer role="contentinfo" className="border-t bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl text-center">
          {/* Brand */}
          <Link
            href="/"
            className="mb-4 inline-flex items-center justify-center gap-2"
            prefetch={false}
            aria-label="ไปหน้าแรก MonkPad" // ใส่ได้ถ้า Wordmark ซ่อน; ถ้าโชว์ Wordmark จะไม่จำเป็น
          >
            <SiteLogo href={null} size="md" iconStyle="mark" />
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
