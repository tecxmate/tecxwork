"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { useStudentI18n } from "@/components/student-locale-provider";
import type { NavRole } from "@/lib/navigation";

export type AppTopBarAccountLabels = {
  roleLabel?: string;
  login?: string;
  logout?: string;
  signup?: string;
};

export function AppTopBarAccountActions({
  role,
  labels,
}: {
  role: NavRole;
  labels?: AppTopBarAccountLabels;
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
    ? labels?.roleLabel ??
      (role === "admin"
        ? "Admin"
        : role === "recruiter"
          ? "Recruiter"
          : "Student")
    : "Guest";
  const logoutLabel = labels?.logout ?? messages.common.logout;
  const loginLabel = labels?.login ?? messages.common.logIn;
  const signupLabel = labels?.signup ?? messages.common.signUp;

  return (
    <div className="flex w-full flex-col gap-1">
      {signedIn ? (
        <div className="flex w-full items-center justify-between px-3 py-1 text-sm font-medium">
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserRound className="h-4 w-4" />
            <span>{statusLabel}</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-destructive transition-colors hover:bg-destructive/10"
            onClick={handleLogout}
          >
            {logoutLabel}
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground">
            <UserRound className="h-4 w-4" />
            <span>{statusLabel}</span>
          </div>
          <div className="my-0.5 h-px w-full bg-border" />
          <div className="flex w-full flex-col gap-1">
            <Link
              href="/login"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LogIn className="h-4 w-4" />
              {loginLabel}
            </Link>
            <div className="my-0.5 h-px w-full bg-border" />
            <Link
              href="/get-started"
              className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {signupLabel}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
