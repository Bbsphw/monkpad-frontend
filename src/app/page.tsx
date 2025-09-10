import Sidebar from "@/components/Sidebar"
import Navbar from "@/components/Navbar"
import CardSummary from "@/components/ui/CardSummary"
import LineChartSection from "@/components/ui/LineChartSection"
import PieChartSection from "@/components/ui/PieChartSection"
import TransactionList from "@/components/ui/TransactionList"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-6">
          {/* สรุปการเงิน */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CardSummary title="รายรับทั้งหมด" value="฿50,000" change="+12.5%" type="income" />
            <CardSummary title="รายจ่ายทั้งหมด" value="฿30,000" change="-8.5%" type="expense" />
            <CardSummary title="ยอดคงเหลือ" value="฿20,000" type="balance" />
            <CardSummary title="อัตราการออม" value="40.0%" type="saving" />
          </div>

          {/* กราฟ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LineChartSection />
            <PieChartSection />
          </div>

          {/* รายการธุรกรรม */}
          <TransactionList />
        </main>
      </div>
    </div>
  )
}
