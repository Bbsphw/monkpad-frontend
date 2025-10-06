// =============================
// FILE: src/types/dashboard.ts
// Purpose: Strong types used on both server/client.
// =============================
import { type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface SidebarData {
  user: User;
  navMain: NavItem[];
}

export type MonthlyItem = { month: string; income: number; expense: number };
export type CategoryItem = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
};
export type DashboardStats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  monthlyData: MonthlyItem[];
  categoryBreakdown: CategoryItem[];
};

export type Transaction = {
  id: string;
  date: string; // ISO
  type: "income" | "expense" | "transfer";
  category: string;
  description: string;
  amount: number; // THB (positive)
  account: string; // e.g., Wallet, KBank, Credit Card
  status: "posted" | "draft" | "void";
};
