// app/(protected)/transactions/_components/transaction-empty-state.tsx
export default function TransactionEmptyState() {
  return (
    <div className="rounded-md border p-10 text-center text-sm text-muted-foreground">
      ยังไม่มีรายการ ลองเพิ่มรายการแรกได้เลย
    </div>
  );
}
