"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { useStudentI18n } from "@/components/student-locale-provider";
import type { NavRole } from "@/lib/navigation";

export function AppTopBarAccountActions({
  role,
}: {
  role: NavRole;
}) {
  const router = useRouter();
  const { messages } = useStudentI18n();
  const signedIn = role !== "guest";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const statusLabel = signedIn
    ? role === "admin"
      ? "Admin"
      : role === "recruiter"
        ? "Recruiter"
        : messages.nav.profile
    : "Guest";

  return (
    <div className="flex w-full min-w-40 flex-col gap-1">
      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
        <UserRound className="h-4 w-4" />
        <span>{statusLabel}</span>
      </div>
      {signedIn ? (
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-destructive transition-premium hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {messages.common.logout}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-foreground transition-premium hover:bg-muted"
          >
            <LogIn className="h-4 w-4" />
            {messages.common.logIn}
          </Link>
          <Link
            href="/get-started"
            className="flex items-center justify-center rounded-lg bg-primary px-2.5 py-1.5 text-primary-foreground transition-premium hover:bg-primary/90"
          >
            {messages.common.signUp}
          </Link>
        </div>
      )}
    </div>
  );
}
