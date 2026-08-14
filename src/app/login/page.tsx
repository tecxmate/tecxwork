"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Users,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building2,
  ShieldCheck,
  X,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { useStudentI18n } from "@/components/student-locale-provider";
import { interpolate } from "@/lib/student-messages";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { AppTopBarActions } from "@/components/app-topbar-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { safeRedirectPath } from "@/lib/safe-redirect";

type ErrorState =
  | { code: "NONE" }
  | { code: "INVALID_PASSWORD"; message: string }
  | { code: "USER_NOT_FOUND"; email: string }
  | { code: "OTHER"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const { messages } = useStudentI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorState, setErrorState] = useState<ErrorState>({ code: "NONE" });
  const [loading, setLoading] = useState(false);
  const [showPipaNotice, setShowPipaNotice] = useState(false);

  useEffect(() => {
    const dismissed =
      typeof window !== "undefined" &&
      window.localStorage.getItem("login_pipa_notice_dismissed") === "1";
    setShowPipaNotice(!dismissed);
  }, []);

  function handleDismissPipaNotice() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("login_pipa_notice_dismissed", "1");
    }
    setShowPipaNotice(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorState({ code: "NONE" });

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      // Parse defensively. A route handler that throws — a missing env var, a database
      // that will not connect — returns Next's HTML error page, not JSON. Calling
      // res.json() before checking res.ok made that throw, land in the catch below, and
      // report a server fault as "network error": the one message that sends someone to
      // check their wifi when the problem is on our side.
      let data: {
        code?: string;
        error?: string;
        user?: { role?: string };
      } | null = null;
      try {
        data = await res.json();
      } catch {
        // Left null — handled by status below.
      }

      if (!res.ok || !data) {
        if (data?.code === "USER_NOT_FOUND") {
          setErrorState({ code: "USER_NOT_FOUND", email: cleanEmail });
        } else if (data?.code === "INVALID_PASSWORD") {
          setErrorState({
            code: "INVALID_PASSWORD",
            message: data.error || messages.login.invalidPassword,
          });
        } else if (res.status >= 500 || !data) {
          // Name the status: "500" is what turns "it is broken" into something the
          // person on the other end can actually look up.
          setErrorState({
            code: "OTHER",
            message: interpolate(messages.login.serverError, { status: res.status }),
          });
        } else {
          setErrorState({
            code: "OTHER",
            message: data.error || messages.login.loginFailed,
          });
        }
        return;
      }

      // A 200 with no user is a malformed response, not a successful sign-in. Routing on
      // it would land the person on /browse looking signed out with no error shown.
      if (!data.user) {
        setErrorState({
          code: "OTHER",
          message: interpolate(messages.login.serverError, { status: res.status }),
        });
        return;
      }

      // Success — honour an explicit destination (an invitation link, say), else route by
      // role. safeRedirectPath refuses anything that is not a same-site path, so a mailed
      // `?next=https://evil.example` cannot bounce someone off the site right after they
      // authenticate.
      const roleHome =
        data.user.role === "admin"
          ? "/admin"
          : data.user.role === "recruiter"
            ? "/dashboard"
            : "/browse";
      router.push(safeRedirectPath(nextParam, roleHome));
      router.refresh();
    } catch {
      setErrorState({
        code: "OTHER",
        message: messages.login.networkError,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.common.back}
          </Link>
          <div className="ml-auto">
            <AppTopBarActions
              mobileOverflow={true}
              desktopChildren={
                <>
                  <ThemeToggle />
                  <StudentLanguageSwitcher />
                </>
              }
              mobileChildren={
                <div className="flex items-center gap-2 px-1 py-1">
                  <ThemeToggle />
                  <div className="flex-1">
                    <StudentLanguageSwitcher />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-sm space-y-4">
          <Card className="w-full">
            <CardHeader className="items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-xl font-bold">
                {messages.login.welcomeBack}
              </h1>
              <p className="text-sm text-muted-foreground">{messages.login.subtitle}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    {messages.login.email}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    inputMode="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium">
                    {messages.login.password}
                  </label>
                  <PasswordInput
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Link
                    href="/forgot-password"
                    className="block text-right text-xs text-muted-foreground hover:text-primary"
                  >
                    {messages.login.forgotPassword}
                  </Link>
                </div>

                {errorState.code === "INVALID_PASSWORD" && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorState.message}</span>
                  </div>
                )}

                {errorState.code === "OTHER" && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorState.message}</span>
                  </div>
                )}

                {errorState.code === "USER_NOT_FOUND" && (
                  <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {messages.login.noAccountFound}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {messages.login.noAccountFor}{" "}
                          <span className="font-medium text-foreground">
                            {errorState.email}
                          </span>
                          . {messages.login.wouldLikeSignup}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href="/register"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-primary/40"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        {messages.login.signUpAsStudent}
                      </Link>
                      <Link
                        href="/recruiter/signup"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-primary/40"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {messages.login.signUpAsRecruiter}
                      </Link>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {messages.login.signingIn}
                    </>
                  ) : (
                    messages.common.logIn
                  )}
                </Button>
              </form>

              <Separator className="my-6" />

              <p className="text-center text-xs text-muted-foreground">
                {messages.login.newToTecxwork}{" "}
                <Link href="/get-started" className="text-primary hover:underline">
                  {messages.common.chooseRole}
                </Link>
              </p>
            </CardContent>
          </Card>

          {showPipaNotice ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 space-y-1 text-xs">
                    <p className="font-semibold">{messages.browsePage.pipaTitle}</p>
                    <p className="text-muted-foreground">
                      {messages.browsePage.pipaBody}
                    </p>
                    <p className="text-muted-foreground">
                      {messages.browsePage.guestHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDismissPipaNotice}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                  aria-label="Dismiss notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
