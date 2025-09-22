"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddTransactionDialog, TransactionFormValues } from "@/components/dashboard/add-transection"
import * as React from "react"

export default function Navbar() {
  const [open, setOpen] = React.useState(false)

  async function handleCreate(values: TransactionFormValues) {
    // TODO: call API หรือ mutate state ที่หน้าอื่น ๆ ได้เหมือนกัน
    // ตัวอย่าง:
    // await fetch("/api/transactions", { method: "POST", body: JSON.stringify(values) })
    console.log("new transaction =>", values)
  }

  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">
      <h1 className="font-semibold">ภาพรวมการเงิน</h1>

      <div className="flex items-center gap-4">
        <AddTransactionDialog
          trigger={<Button variant="outline" onClick={() => setOpen(true)}>เพิ่มรายการ</Button>}
          open={open}
          onOpenChange={setOpen}
          onSubmit={handleCreate}
          categories={["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บิล", "อื่นๆ"]}
        />

        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>MP</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
