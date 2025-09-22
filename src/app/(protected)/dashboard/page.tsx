import Sidebar from "@/components/dashboard/sidebar"
import Navbar from "@/components/dashboard/navbar"
import CardSummary from "@/components/dashboard/card-summary"
import LineChartSection from "@/components/dashboard/line-chart"
import PieChartSection from "@/components/dashboard/pie-chart"
import TransactionList from "@/components/dashboard/transaction-list"

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Sidebar คงที่ (ไม่เลื่อน) */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* คอลัมน์ขวา */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar คงที่ด้านบนของคอลัมน์ขวา */}
        <div className="sticky top-0 z-20">
          <Navbar />
        </div>

        {/* เนื้อหาที่เลื่อนได้ */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* สรุปการเงิน */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CardSummary title="รายรับทั้งหมด" value="฿50,000" change="+12.5%" type="income" />
            <CardSummary title="รายจ่ายทั้งหมด" value="฿30,000" change="-8.5%" type="expense" />
            <CardSummary title="ยอดคงเหลือ" value="฿20,000" type="balance" />
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
