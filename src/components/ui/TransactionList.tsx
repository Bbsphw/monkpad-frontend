import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const transactions = [
  { title: "เงินเดือน", type: "รายรับ", amount: "+฿50,000", date: "1/1/2568" },
  { title: "ค่าไฟฟ้า", type: "รายจ่าย", amount: "-฿1,000", date: "1/1/2568" },
  { title: "ค่าเน็ต", type: "รายจ่าย", amount: "-฿100", date: "1/1/2568" },
  { title: "ค่าซื้อของ", type: "รายจ่าย", amount: "-฿500", date: "1/1/2568" },
]

export default function TransactionList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการธุรกรรมล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.map((t, i) => (
          <div key={i} className="flex justify-between py-2">
            <div>
              <p className="font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.type} • {t.date}</p>
            </div>
            <p className={t.amount.startsWith("+") ? "text-green-600" : "text-red-600"}>
              {t.amount}
            </p>
            {i < transactions.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
