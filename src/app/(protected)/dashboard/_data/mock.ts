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
  { date: "2024-07-01", income: 45000, expense: 30000 },
  { date: "2024-08-01", income: 47000, expense: 32000 },
  { date: "2024-09-01", income: 50000, expense: 35000 },
  { date: "2024-10-01", income: 52000, expense: 36000 },
  { date: "2024-11-01", income: 48000, expense: 34000 },
  { date: "2024-12-01", income: 53000, expense: 37000 },
  { date: "2025-01-01", income: 55000, expense: 38000 },
  { date: "2025-02-01", income: 60000, expense: 40000 },
  { date: "2025-03-01", income: 62000, expense: 42000 },
  { date: "2025-04-01", income: 58000, expense: 39000 },
  { date: "2025-05-01", income: 61000, expense: 41000 },
  { date: "2025-06-01", income: 64000, expense: 43000 },
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
    date: "2024-09-01",
    type: "income",
    category: "เงินเดือน",
    amount: 50000,
    note: "รับเงินเดือน",
  },
  {
    id: "2",
    date: "2024-09-02",
    type: "expense",
    category: "อาหาร",
    amount: 1500,
    note: "กินข้าวกลางวัน",
  },
  {
    id: "3",
    date: "2024-09-03",
    type: "expense",
    category: "ค่าเดินทาง",
    amount: 300,
    note: "ค่า BTS",
  },
  {
    id: "4",
    date: "2024-09-04",
    type: "expense",
    category: "ช้อปปิ้ง",
    amount: 2000,
    note: "ซื้อเสื้อผ้า",
  },
  {
    id: "5",
    date: "2024-09-05",
    type: "income",
    category: "ของขวัญ",
    amount: 1000,
    note: "รับของขวัญ",
  },
  {
    id: "6",
    date: "2024-09-06",
    type: "expense",
    category: "อื่นๆ",
    amount: 500,
    note: "ซื้อของใช้ในบ้าน",
  },
  {
    id: "7",
    date: "2024-09-07",
    type: "expense",
    category: "ที่พัก",
    amount: 4000,
    note: "จ่ายค่าเช่าห้อง",
  },
  {
    id: "8",
    date: "2024-09-08",
    type: "income",
    category: "โบนัส",
    amount: 2000,
    note: "รับโบนัสจากงาน",
  },
  {
    id: "9",
    date: "2024-09-09",
    type: "expense",
    category: "อาหาร",
    amount: 1200,
    note: "กินข้าวเย็น",
  },
  {
    id: "10",
    date: "2024-09-10",
    type: "expense",
    category: "ค่าเดินทาง",
    amount: 400,
    note: "ค่าแท็กซี่",
  },
  {
    id: "11",
    date: "2024-09-11",
    type: "expense",
    category: "ช้อปปิ้ง",
    amount: 2500,
    note: "ซื้อของขวัญ",
  },
  {
    id: "12",
    date: "2024-09-12",
    type: "income",
    category: "ขายของ",
    amount: 1500,
    note: "ขายของออนไลน์",
  },
  {
    id: "13",
    date: "2024-09-13",
    type: "expense",
    category: "อื่นๆ",
    amount: 800,
    note: "ค่าบริการอินเทอร์เน็ต",
  },
  {
    id: "14",
    date: "2024-09-14",
    type: "expense",
    category: "ที่พัก",
    amount: 4500,
    note: "จ่ายค่าน้ำค่าไฟ",
  },
  {
    id: "15",
    date: "2024-09-15",
    type: "income",
    category: "เงินคืน",
    amount: 300,
    note: "ได้เงินคืนจากบัตรเครดิต",
  },
  {
    id: "16",
    date: "2024-09-16",
    type: "expense",
    category: "อาหาร",
    amount: 900,
    note: "กินขนม",
  },
  {
    id: "17",
    date: "2024-09-17",
    type: "expense",
    category: "ค่าเดินทาง",
    amount: 350,
    note: "ค่า MRT",
  },
  {
    id: "18",
    date: "2024-09-18",
    type: "expense",
    category: "ช้อปปิ้ง",
    amount: 1800,
    note: "ซื้อของใช้ส่วนตัว",
  },
  {
    id: "19",
    date: "2024-09-19",
    type: "income",
    category: "ของขวัญ",
    amount: 700,
    note: "รับของขวัญจากเพื่อน",
  },
  {
    id: "20",
    date: "2024-09-20",
    type: "expense",
    category: "อื่นๆ",
    amount: 600,
    note: "ค่าบริการโทรศัพท์",
  },
];
