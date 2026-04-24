"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { useStudentI18n } from "@/components/student-locale-provider";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { interpolate } from "@/lib/student-messages";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { messages } = useStudentI18n();
  const forgot = messages.forgotPassword;
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || forgot.errors.sendCodeFailed);

      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : forgot.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || forgot.errors.invalidCode);

      setResetToken(data.resetToken);
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : forgot.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(forgot.errors.passwordMismatch);
      return;
    }
    if (password.length < 6) {
      setError(forgot.errors.passwordTooShort);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          resetToken,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || forgot.errors.resetFailed);

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : forgot.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  const stepConfig = {
    email: {
      icon: Mail,
      title: forgot.steps.emailTitle,
      subtitle: forgot.steps.emailSubtitle,
    },
    code: {
      icon: KeyRound,
      title: forgot.steps.codeTitle,
      subtitle: interpolate(forgot.steps.codeSubtitle, {
        email: email || forgot.emailPlaceholder,
      }),
    },
    password: {
      icon: Lock,
      title: forgot.steps.passwordTitle,
      subtitle: forgot.steps.passwordSubtitle,
    },
    done: {
      icon: CheckCircle2,
      title: forgot.steps.doneTitle,
      subtitle: forgot.steps.doneSubtitle,
    },
  };

  const current = stepConfig[step];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/login"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {forgot.backToLogin}
          </Link>
          <div className="ml-auto">
            <StudentLanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <current.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold">{current.title}</h1>
            <p className="text-center text-sm text-muted-foreground">
              {current.subtitle}
            </p>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    {forgot.emailLabel}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={forgot.emailPlaceholder}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {error && <ErrorMsg message={error} />}
                <Button type="submit" disabled={loading || !email.trim()} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {forgot.sendingCode}
                    </>
                  ) : (
                    forgot.sendCode
                  )}
                </Button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="code" className="text-sm font-medium">
                    {forgot.codeLabel}
                  </label>
                  <Input
                    id="code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={forgot.codePlaceholder}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    className="text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    {forgot.codeExpires}
                  </p>
                </div>
                {error && <ErrorMsg message={error} />}
                <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {forgot.verifyingCode}
                    </>
                  ) : (
                    forgot.verifyCode
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(""); setError(""); }}
                  className="block w-full cursor-pointer text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {forgot.resendCode}
                </button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    {forgot.newPasswordLabel}
                  </label>
                  <PasswordInput
                    id="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={forgot.newPasswordPlaceholder}
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    {forgot.confirmPasswordLabel}
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={forgot.confirmPasswordPlaceholder}
                    autoComplete="new-password"
                  />
                </div>
                {error && <ErrorMsg message={error} />}
                <Button
                  type="submit"
                  disabled={loading || password.length < 6 || !confirmPassword}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {forgot.resettingPassword}
                    </>
                  ) : (
                    forgot.resetPassword
                  )}
                </Button>
              </form>
            )}

            {step === "done" && (
              <Button onClick={() => router.push("/login")} className="w-full">
                {forgot.goToLogin}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-xs">{message}</span>
    </div>
  );
}
