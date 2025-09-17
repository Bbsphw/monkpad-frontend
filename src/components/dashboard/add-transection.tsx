"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type TransactionFormValues = {
  type: "income" | "expense"
  amount: number
  category: string
  note?: string
  date: string // ISO yyyy-MM-dd
  file?: File | null
}

type AddTransactionDialogProps = {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit: (values: TransactionFormValues) => void | Promise<void>
  defaultValues?: Partial<TransactionFormValues>
  categories?: string[]
  contentClassName?: string
}

export function AddTransactionDialog({
  trigger,
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  categories = ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บิล/ค่าสาธารณูปโภค", "อื่นๆ"],
  contentClassName = "max-w-xl",
}: AddTransactionDialogProps) {
  const [pending, setPending] = React.useState(false)

  // ---- อัปโหลด + พรีวิว ----
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  React.useEffect(() => {
    // ปิด dialog แล้วเคลียร์รูป
    if (!open) {
      setFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }, [open]) // eslint-disable-line

  // ---- ฟอร์ม ----
  const [form, setForm] = React.useState<TransactionFormValues>({
    type: defaultValues?.type ?? "expense",
    amount: defaultValues?.amount ?? 0,
    category: defaultValues?.category ?? "",
    note: defaultValues?.note ?? "",
    date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
    file: null,
  })

  function update<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.category) return alert("กรุณาเลือกหมวดหมู่")
    if (!form.amount || Number.isNaN(form.amount)) return alert("กรุณากรอกจำนวนเงินให้ถูกต้อง")

    try {
      setPending(true)
      await onSubmit({ ...form, file })
      onOpenChange?.(false)
    } finally {
      setPending(false)
    }
  }

  const Content = (
    <DialogContent className={contentClassName}>
      <DialogHeader>
        <DialogTitle>เพิ่มรายการธุรกรรม</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* อัปโหลดไฟล์/สลิป + พรีวิว */}
        <div className="space-y-2">
          <span className="block text-sm font-medium">แนบภาพ/สลิป (ไม่บังคับ)</span>

          {!previewUrl ? (
            <div
              className="border-2 border-dashed rounded-md p-6 text-center text-sm text-muted-foreground cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              Drag & drop เพื่ออัปโหลด หรือคลิกเลือกไฟล์<br />
              รองรับ PNG, JPG
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative w-full overflow-hidden rounded-md border">
                <img src={previewUrl} alt="Preview" className="w-full h-64 object-contain bg-muted" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                  เปลี่ยนรูป
                </Button>
                <Button type="button" variant="ghost" onClick={() => setFile(null)}>
                  ลบรูป
                </Button>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* ประเภท */}
        <div>
          <label className="block text-sm font-medium mb-1">ประเภท</label>
          <select
            className="w-full border rounded-md p-2"
            value={form.type}
            onChange={(e) => update("type", e.target.value as "income" | "expense")}
          >
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
        </div>

        {/* จำนวนเงิน */}
        <div>
          <label className="block text-sm font-medium mb-1">จำนวนเงิน</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full border rounded-md p-2"
            value={Number.isNaN(form.amount) ? "" : form.amount}
            onChange={(e) => update("amount", Number(e.target.value))}
          />
        </div>

        {/* หมวดหมู่ */}
        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
          <select
            className="w-full border rounded-md p-2"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="" disabled>เลือกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-medium mb-1">รายละเอียด</label>
          <textarea
            className="w-full border rounded-md p-2"
            placeholder="ระบุรายละเอียด..."
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
          />
        </div>

        {/* วันที่ */}
        <div>
          <label className="block text-sm font-medium mb-1">วันที่</label>
          <input
            type="date"
            className="w-full border rounded-md p-2"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </DialogContent>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      {Content}
    </Dialog>
  )
}
