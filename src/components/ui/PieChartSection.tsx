"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "อาหาร", value: 24 },
  { name: "ค่าไฟ/น้ำ", value: 18 },
  { name: "เดินทาง", value: 12 },
  { name: "ช้อปปิ้ง", value: 40 },
  { name: "อื่นๆ", value: 6 },
]

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function PieChartSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>สัดส่วนค่าใช้จ่าย</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
