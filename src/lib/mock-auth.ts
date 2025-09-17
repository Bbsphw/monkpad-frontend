// src/lib/mock-auth.ts
import type { Role } from "@/types/user";

export type MockUser = {
  id: string;
  username: string;
  email: string;
  role: Role;
  password: string;
};

// 🟢 mock users สำหรับ dev/test
const mockUsers: MockUser[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    password: "Admin123456",
  },
  {
    id: "2",
    username: "user",
    email: "user@example.com",
    role: "user",
    password: "User123456",
  },
];

// mock login function
export async function mockLogin(identifier: string, password: string) {
  await new Promise((r) => setTimeout(r, 500)); // simulate API delay

  const user = mockUsers.find(
    (u) =>
      (u.username === identifier || u.email === identifier) &&
      u.password === password
  );

  if (!user) throw new Error("Invalid credentials");

  return {
    id: user.id,
    name: user.username,
    email: user.email,
    role: user.role,
  };
}
