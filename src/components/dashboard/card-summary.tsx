import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function CardSummary({
  title,
  value,
  change,
  type,
}: {
  title: string
  value: string
  change?: string
  type: "income" | "expense" | "balance"
  progress?: number
}) {
  // สีแบบ HEX (ตรงกับธีมโทนอ่อน)
  const cardStyle: Record<typeof type, React.CSSProperties> = {
    income: { backgroundColor: "#d1fae5", color: "#065f46", borderColor: "#a7f3d0" }, // mint-ish
    expense: { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" },
    balance: { backgroundColor: "#e0e7ff", color: "#1e40af", borderColor: "#c7d2fe" },

  }

  // สีของตัวเลขเปลี่ยนแปลง
  const changeColor: Record<typeof type, React.CSSProperties> = {
    income: { color: "#15803d" }, // green-700
    expense: { color: "#b91c1c" }, // red-700
    balance: { color: "#1d4ed8" }, // blue-700

  }

  // อิโมจิมุมขวาบนของการ์ด
  const cornerEmoji: Record<typeof type, string> = {
    income: "↗︎",
    expense: "↘︎",
    balance: "💲",

  }

  // อิโมจิหน้าบรรทัด change
  const changeEmoji: Record<typeof type, string> = {
    income: "↗",
    expense: "↘︎",
    balance: "💰",

  }

  return (
    <Card
      style={cardStyle[type]}
      className={cn("border")}
    >
      <CardHeader>
        <CardTitle className="text-sm opacity-70">{title}</CardTitle>

        {/* มุมขวาบนแบบ badge วงกลมโปร่งใส */}
        <CardAction>
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
            style={{
              borderColor: "rgba(0,0,0,.08)",
              backgroundColor: "rgba(255,255,255,.6)",
              backdropFilter: "blur(4px)",
              fontSize: 14,
            }}
          >
            {cornerEmoji[type]}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-bold">{value}</p>

        {change && (
          <p className="mt-1 text-sm" style={changeColor[type]}>
            <span className="mr-1">{changeEmoji[type]}</span>
            {change}
          </p>
        )}


      </CardContent>
    </Card>
  )
}
