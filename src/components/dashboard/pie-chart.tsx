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


// ฟังก์ชันสุ่มสีแบบ HSL เพื่อให้อ่านง่าย
const randomColor = () => {
  const hue = Math.floor(Math.random() * 360) // 0 - 360
  const saturation = 60 + Math.random() * 20   // 60–80%
  const lightness = 45 + Math.random() * 15    // 45–60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// เตรียมสีให้เท่ากับจำนวน data
const COLORS = data.map(() => randomColor())

const RADIAN = Math.PI / 180
const total = data.reduce((s, d) => s + d.value, 0)
const isPercent = total === 100

const baht = (n: number) => `฿${n.toLocaleString()}`

// custom label ที่จะวางนอกกราฟ
import type { PieLabelRenderProps } from "recharts/types/polar/Pie";

const renderLabel = (props: PieLabelRenderProps) => {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    outerRadius = 0,
    name = "",
    value = 0,
    percent = 0
  } = props
  const r = Number(outerRadius) + 14 // ระยะออกจากชิ้นกราฟ
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN)
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN)
  const text = `${name} ${baht(Number(value))} (${Math.round(Number(percent)*100)}%)`

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > Number(cx) ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {text}
    </text>
  )
}

export default function PieChartSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>สัดส่วนค่าใช้จ่าย</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              paddingAngle={1.5}
              labelLine // ให้มีเส้น
              label={renderLabel} // วาง label นอกกราฟ
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(v: number, n: string, p: number) => {
                const percent = p && typeof p.percent === "number" ? p.percent : 0
                const share = `${(percent * 100).toFixed(0)}%`
                return isPercent ? [`${v}%`, n] : [`${baht(v)} (${share})`, n]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
