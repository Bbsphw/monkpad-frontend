// src/lib/auth.ts
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import type { Role, User } from "@/types/user";

// 🟢 dev/test
import { mockLogin } from "./mock-auth";
// 🔵 prod จริง
// import { apiLogin } from "./api-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = z
          .object({
            identifier: z.string().min(4),
            password: z.string().min(8),
          })
          .safeParse(raw);
        if (!parsed.success) return null;

        try {
          // dev mode → mock
          return await mockLogin(parsed.data.identifier, parsed.data.password);

          // prod mode → api
          // return await apiLogin(parsed.data);
        } catch (err) {
          console.error("[authorize] login failed", err);
          return null;
        }
      },
    }),
  ],
  pages: { signIn: "/sign-in" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as User;
        token.id = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role as Role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// helper สำหรับใช้ใน server components
export const auth = () => getServerSession(authOptions);
