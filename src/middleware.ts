// middleware.ts
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin")) {
      const role = token?.role ?? "user";
      if (role !== "admin") return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname;
        const isPublic =
          p === "/" ||
          p.startsWith("/pricing") ||
          p.startsWith("/docs") ||
          p === "/sign-in" ||
          p === "/sign-up";
        if (isPublic) return true;

        const isProtected =
          p.startsWith("/dashboard") ||
          p.startsWith("/settings") ||
          p.startsWith("/admin");
        if (!isProtected) return true;
        return !!token;
      },
    },
    pages: { signIn: "/sign-in" },
  }
);

export const config = {
  matcher: [
    "/",
    "/pricing",
    "/docs/:path*",
    "/sign-in",
    "/sign-up",
    "/dashboard/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
