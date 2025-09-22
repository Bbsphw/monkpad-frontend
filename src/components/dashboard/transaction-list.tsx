"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, type LucideIcon  } from "lucide-react"

type TxType = "income" | "expense"

type Transaction = {
  id: string
  title: string
  category: string
  type: TxType
  amount: number
  date: string | Date
}

const transactions: Transaction[] = [
  { id: "1", title: "เงินเดือน", category: "เงินเดือน", type: "income", amount: 50000, date: "2025-01-09" },
  { id: "2", title: "ค่าไฟฟ้า", category: "ค่าน้ำ-ไฟ", type: "expense", amount: 1000, date: "2025-01-09" },
  { id: "3", title: "ค่าน้ำ", category: "ค่าน้ำ-ไฟ", type: "expense", amount: 100, date: "2025-01-09" },
  { id: "4", title: "ค่าเสื้อผ้า", category: "ช้อปปิ้ง", type: "expense", amount: 500, date: "2025-01-09" },
]

const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`
const thaiDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "numeric", year: "numeric" })

const typeConfig: Record<TxType, { icon: LucideIcon; tone: string; text: string; sign: string }> = {
  income: {
    icon: TrendingUp,
    tone: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-600",
    sign: "+",
  },
  expense: {
    icon: TrendingDown,
    tone: "bg-rose-100 text-rose-600",
    text: "text-rose-600",
    sign: "-",
  },
}

function TransactionCard({ tx }: { tx: Transaction }) {
  const Cfg = typeConfig[tx.type]
  const Icon = Cfg.icon

  return (
    <Card className="rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-1.5">
        <div className="flex items-center gap-2">
          {/* Icon bubble */}
          <div className={`h-10 w-10 rounded-full grid place-items-center ${Cfg.tone}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{tx.title}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs rounded-full px-2 py-0.5 bg-black/5"> {tx.type === "income" ? "รายได้" : "รายจ่าย"} </span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-black text-white"> {tx.category} </span>
            </div>
          </div>

          {/* Amount + date */}
          <div className="text-right">
            <div className={`font-semibold ${Cfg.text}`}>
              {Cfg.sign}
              {baht(tx.amount)}
            </div>
            <div className="text-xs text-muted-foreground">{thaiDate(tx.date)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TransactionList() {
  return (
    <div className="space-y-3">
      {/* หัวข้อ */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="i-mdi-receipt text-lg" /> {/* เปลี่ยนเป็นไอคอนที่คุณมีได้ */}
        รายการธุรกรรมล่าสุด
      </div>

      {/* ลิสต์การ์ด */}
      {transactions.map((tx) => (
        <TransactionCard key={tx.id} tx={tx} />
      ))}
    </div>
  )
}
