import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CardSummary({ title, value, change, type }: { 
  title: string, value: string, change?: string, type: "income"|"expense"|"balance"|"saving" 
}) {
  const colors = {
    income: "text-green-600",
    expense: "text-red-600",
    balance: "text-blue-600",
    saving: "text-purple-600",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {change && <p className={`text-sm ${colors[type]}`}>{change}</p>}
      </CardContent>
    </Card>
  )
}
