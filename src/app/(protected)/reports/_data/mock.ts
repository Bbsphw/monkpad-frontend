// lib/reports-mock.ts

export type MonthRow = {
  month: string;      // ก.ค., ส.ค., ...
  income: number;
  expense: number;
};

export type ExpenseSlice = {
  name: string;
  value: number;
  color?: string;
};

export const monthly: MonthRow[] = [
  { month: 'ก.ค.', income: 42000, expense: 29000 },
  { month: 'ส.ค.', income: 45000, expense: 31000 },
  { month: 'ก.ย.', income: 44000, expense: 27000 },
  { month: 'ต.ค.', income: 47000, expense: 34000 },
  { month: 'พ.ย.', income: 26000, expense: 21000 },
  { month: 'ธ.ค.', income: 24000, expense: 22000 },
];


export const expenseSlices: ExpenseSlice[] = [
  { name: 'ค่าเช่าบ้าน',   value: 15000 },
  { name: 'อาหาร',        value: 8000 },
  { name: 'ค่าเดินทาง',   value: 2500 },
  { name: 'บิล',          value: 1500 },  // ❗ ยืนยันชื่อว่า "บิล" ไม่ใช่ "บิลอื่นๆ"
  { name: 'ค่าน้ำ-ไฟ',     value: 1200 },
  { name: 'อินเทอร์เน็ต', value: 900 },
  { name: 'โทรศัพท์',      value: 650 },
  { name: 'ความบันเทิง',   value: 700 },
  { name: 'ของใช้ในบ้าน',  value: 450 },
  { name: 'ให้แฟน',        value: 150 },   // ✅ รายการเล็กมาก จะถูกไปรวม “อื่นๆ”
];

// เดือนที่อยากไฮไลต์ในกราฟแท่ง (เงาสีเทา)
export const highlightMonth = 'ก.ย.';
