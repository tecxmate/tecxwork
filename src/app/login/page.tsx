"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Users,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building2,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

type ErrorState =
  | { code: "NONE" }
  | { code: "INVALID_PASSWORD"; message: string }
  | { code: "USER_NOT_FOUND"; email: string }
  | { code: "OTHER"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorState, setErrorState] = useState<ErrorState>({ code: "NONE" });
  const [loading, setLoading] = useState(false);

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

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "USER_NOT_FOUND") {
          setErrorState({ code: "USER_NOT_FOUND", email: cleanEmail });
        } else if (data.code === "INVALID_PASSWORD") {
          setErrorState({
            code: "INVALID_PASSWORD",
            message: data.error || "Invalid password",
          });
        } else {
          setErrorState({
            code: "OTHER",
            message: data.error || "Login failed",
          });
        }
        return;
      }

      // Success — route by role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else if (data.user.role === "recruiter") {
        router.push("/dashboard");
      } else {
        router.push("/browse");
      }
      router.refresh();
    } catch {
      setErrorState({
        code: "OTHER",
        message: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Log in to V-GEN</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
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
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
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
                        No account found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        No account exists for{" "}
                        <span className="font-medium text-foreground">
                          {errorState.email}
                        </span>
                        . Would you like to sign up?
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/register"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-primary/40"
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      Sign up as Student
                    </Link>
                    <Link
                      href="/recruiter/signup"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-primary/40"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Sign up as Recruiter
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
                    Signing in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            <p className="text-center text-xs text-muted-foreground">
              New to V-GEN?{" "}
              <Link href="/" className="text-primary hover:underline">
                Choose your role
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
