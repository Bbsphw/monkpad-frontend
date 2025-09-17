"use client"

import { Home, List, BarChart3, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  return (
    <div className="h-full  overflow-y-auto w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 font-bold text-xl">MonkPad</div>
      <nav className="flex-1 space-y-2 px-4">
        <Button variant="ghost" className="w-full justify-start"><Home className="mr-2 h-4 w-4"/> ภาพรวม</Button>
        <Button variant="ghost" className="w-full justify-start"><List className="mr-2 h-4 w-4"/> รายการธุรกรรม</Button>
        <Button variant="ghost" className="w-full justify-start"><BarChart3 className="mr-2 h-4 w-4"/> รายงาน</Button>
      </nav>
      <div className="p-4">
        <Button variant="destructive" className="w-full"><LogOut className="mr-2 h-4 w-4"/> ออกจากระบบ</Button>
      </div>
    </div>
  )
}
