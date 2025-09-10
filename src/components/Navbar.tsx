"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Navbar() {
  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">
      <h1 className="font-semibold">ภาพรวมการเงิน</h1>
      <div className="flex items-center gap-4">
        <Button variant="outline">เพิ่มรายการ</Button>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>MP</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
