"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "ม.ค.", income: 40000, expense: 30000, balance: 10000 },
  { name: "ก.พ.", income: 42000, expense: 28000, balance: 14000 },
  { name: "มี.ค.", income: 45000, expense: 32000, balance: 13000 },
  { name: "เม.ย.", income: 46000, expense: 31000, balance: 15000 },
  { name: "พ.ค.", income: 50000, expense: 33000, balance: 17000 },
]

export default function LineChartSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>แนวโน้มรายรับ-รายจ่าย</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name"/>
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#22c55e" />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" />
            <Line type="monotone" dataKey="balance" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
