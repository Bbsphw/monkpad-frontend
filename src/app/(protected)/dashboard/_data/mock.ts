// src/app/(protected)/dashboard/_data/mock.ts
// Mock data for dashboard components
export interface TrafficRow {
  date: string;
  income: number;
  expense: number;
}

export interface CategoryRow {
  category: string;
  value: number;
}

export interface TransactionRow {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string;
}

export const trafficData: TrafficRow[] = [
  { date: "01-07-2024", income: 45000, expense: 30000 },
  { date: "01-08-2024", income: 47000, expense: 31000 },
  { date: "01-09-2024", income: 50000, expense: 33000 },
  { date: "01-10-2024", income: 52000, expense: 35000 },
  { date: "01-11-2024", income: 48000, expense: 32000 },
  { date: "01-12-2024", income: 53000, expense: 34000 },
  { date: "01-01-2025", income: 55000, expense: 36000 },
  { date: "01-02-2025", income: 60000, expense: 40000 },
  { date: "01-03-2025", income: 62000, expense: 42000 },
  { date: "01-04-2025", income: 58000, expense: 39000 },
  { date: "01-05-2025", income: 61000, expense: 41000 },
  { date: "01-06-2025", income: 65000, expense: 43000 },
];

export const categoryData: CategoryRow[] = [
  { category: "อาหาร", value: 10000 },
  { category: "ค่าเดินทาง", value: 7000 },
  { category: "ที่พัก", value: 5000 },
  { category: "ช้อปปิ้ง", value: 3000 },
  { category: "อื่นๆ", value: 2000 },
];

export const transactionRows: TransactionRow[] = [
  {
    id: "1",
    date: "01-09-2024",
    type: "income",
    category: "เงินเดือน",
    amount: 50000,
    note: "รับเงินเดือน",
  },
  {
    id: "2",
    date: "01-09-2024",
    type: "expense",
    category: "ค่าไฟฟ้า",
    amount: 1500,
    note: "เดือนสิงหา",
  },
  {
    id: "3",
    date: "03-09-2024",
    type: "expense",
    category: "ค่าเดินทาง",
    amount: 200,
    note: "MRT",
  },
  {
    id: "4",
    date: "04-09-2024",
    type: "expense",
    category: "อาหาร",
    amount: 500,
    note: "ร้านก๋วยเตี๋ยว",
  },
  {
    id: "5",
    date: "05-09-2024",
    type: "expense",
    category: "ช้อปปิ้ง",
    amount: 1200,
    note: "เสื้อผ้า",
  },
  {
    id: "6",
    date: "06-09-2024",
    type: "income",
    category: "ของขวัญ",
    amount: 3000,
    note: "รับเงินจากญาติ",
  },
  {
    id: "7",
    date: "07-09-2024",
    type: "expense",
    category: "อื่นๆ",
    amount: 800,
    note: "ค่าขนม",
  },
  {
    id: "8",
    date: "08-09-2024",
    type: "expense",
    category: "อาหาร",
    amount: 600,
    note: "ร้านกาแฟ",
  },
  {
    id: "9",
    date: "09-09-2024",
    type: "expense",
    category: "ค่าเดินทาง",
    amount: 150,
    note: "รถเมล์",
  },
  {
    id: "10",
    date: "10-09-2024",
    type: "expense",
    category: "ที่พัก",
    amount: 4000,
    note: "ค่าเช่าห้อง",
  },
];
