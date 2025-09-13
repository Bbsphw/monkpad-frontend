// components/how-it-works.tsx
"use client";

type Step = {
  step: number;
  title: string;
  description: string;
};

const STEPS = [
  {
    step: 1,
    title: "อัปโหลดสลิป",
    description: "ถ่ายภาพหรืออัปโหลดสลิปโอนเงินจากธนาคาร",
  },
  {
    step: 2,
    title: "ระบบประมวลผล",
    description: "AI อ่านและดึงข้อมูลจากสลิปอัตโนมัติ",
  },
  {
    step: 3,
    title: "ตรวจสอบและบันทึก",
    description: "ตรวจสอบความถูกต้องและบันทึกเข้าระบบ",
  },
] as const satisfies ReadonlyArray<Step>;

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-16 text-center">
          <h2
            id="how-title"
            className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance"
          >
            วิธีการใช้งาน
          </h2>
          <p className="text-xl text-muted-foreground">
            เพียง 3 ขั้นตอนง่ายๆ ก็สามารถจัดการการเงินได้อย่างมืออาชีพ
          </p>
        </div>

        {/* Ordered steps */}
        <ol role="list" className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.step} className="relative">
              <div className="h-full rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {s.step}
                  <span className="sr-only"> ขั้นตอน</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="text-muted-foreground">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
