// app/(protected)/transactions/_components/transaction-add-dialog.tsx
"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  transactionSchema,
  type TransactionFormValues,
} from "../_schemas/transaction-schema";
import { TransactionService } from "../_services/transaction-service";
import { toast } from "sonner";
import { useTransactionsContext } from "./transaction-filters";

export default function TransactionAddDialog({
  open,
  onOpenChange,
  defaultValues,
}: {
  open?: boolean;
  onOpenChange?: (b: boolean) => void;
  defaultValues?: Partial<TransactionFormValues>;
}) {
  const { reload } = useTransactionsContext();

  /**
   * (จุดสำคัญ) บังคับ generic ของ zodResolver ให้เป็น Resolver<TransactionFormValues>
   * เพื่อให้ตรงกับ useForm<TransactionFormValues>() ทุกเวอร์ชันของ @hookform/resolvers
   */
  const resolver = zodResolver(
    transactionSchema
  ) as unknown as Resolver<TransactionFormValues>;

  const form = useForm<TransactionFormValues>({
    resolver,
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
      category: "",
      amount: 0,
      note: "",
      status: "posted",
      source: "manual",
      ...defaultValues,
    },
  });

  const isEdit = Boolean(defaultValues?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!open && (
        <DialogTrigger asChild>
          <Button>+ เพิ่มรายการ</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              if (isEdit && defaultValues?.id) {
                await TransactionService.update(defaultValues.id, values);
                toast.success("อัปเดตรายการสำเร็จ");
              } else {
                await TransactionService.create(values);
                toast.success("เพิ่มรายการสำเร็จ");
              }
              onOpenChange?.(false);
              reload();
            } catch (e: any) {
              toast.error(e?.message ?? "บันทึกไม่สำเร็จ");
            }
          })}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">วันที่</Label>
              <Input id="date" type="date" {...form.register("date")} />
              <FormError msg={form.formState.errors.date?.message} />
            </div>

            <div>
              <Label htmlFor="type">ประเภท</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v: "income" | "expense" | "transfer") =>
                  form.setValue("type", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormError msg={form.formState.errors.type?.message} />
            </div>

            <div>
              <Label htmlFor="category">หมวดหมู่</Label>
              <Input
                id="category"
                placeholder="เช่น Food / Transport / Salary"
                {...form.register("category")}
              />
              <FormError msg={form.formState.errors.category?.message} />
            </div>

            <div>
              <Label htmlFor="amount">จำนวนเงิน</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                // ปล่อยให้ schema จัดการ coerce → number
                {...form.register("amount")}
              />
              <FormError msg={form.formState.errors.amount?.message} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="note">โน้ต</Label>
              <Input
                id="note"
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                {...form.register("note")}
              />
              <FormError msg={form.formState.errors.note?.message} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit">
              {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}
