import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "user" | "admin";
  }

  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin";
  }
}
