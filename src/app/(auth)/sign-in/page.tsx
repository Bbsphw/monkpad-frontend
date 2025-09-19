//src/app/(auth)/sign-in/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignInClient from "./signIn-client";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth().catch(() => null);
  if (session) redirect("/dashboard");

  return (
    <SignInClient redirect={searchParams.redirect as string | undefined} />
  );
}
