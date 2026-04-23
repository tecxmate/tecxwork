"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { RecruiterLanguageSwitcher } from "@/components/recruiter-language-switcher";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

type Step = "email" | "profile";

export function RecruiterSignupScreen() {
  const router = useRouter();
  const { messages } = useRecruiterI18n();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confirmsLawfulHiring, setConfirmsLawfulHiring] = useState(false);
  const [confirmsNoDiscrimination, setConfirmsNoDiscrimination] = useState(false);
  const [confirmsWorkAuthorizationChecks, setConfirmsWorkAuthorizationChecks] =
    useState(false);

  async function handleEmailCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/recruiters/check-domain?email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || messages.signup.errors.checkFailed);

      setCompany(data.company);
      setIndustry(data.industry);
      setStep("profile");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : messages.signup.errors.somethingWentWrong
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recruiters/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          company,
          industry,
          description: description.trim(),
          contactEmail: email.trim(),
          confirmsLawfulHiring,
          confirmsNoDiscrimination,
          confirmsWorkAuthorizationChecks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || messages.signup.errors.signupFailed);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : messages.signup.errors.somethingWentWrong
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.common.back}
          </Link>
          <RecruiterLanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader className="items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-xl font-bold">
                {messages.signup.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === "email"
                  ? messages.signup.emailStepSubtitle
                  : messages.signup.profileStepSubtitle}
              </p>
            </CardHeader>
            <CardContent>
              {step === "email" ? (
                <form onSubmit={handleEmailCheck} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium">
                      {messages.signup.workEmail}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={messages.signup.placeholders.email}
                      autoComplete="email"
                    />
                    <p className="text-xs text-muted-foreground">
                      {messages.signup.approvedDomainsOnly}
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!email.trim() || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {messages.signup.checking}
                      </>
                    ) : (
                      messages.common.continue
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    {messages.signup.alreadyHaveAccount}{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      {messages.signup.logIn}
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-foreground">{company}</p>
                      <p className="text-muted-foreground">
                        {email} &middot; {industry}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium">
                      {messages.signup.yourName} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={messages.signup.placeholders.name}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium">
                      {messages.signup.password} <span className="text-destructive">*</span>
                    </label>
                    <PasswordInput
                      id="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={messages.signup.placeholders.password}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="desc" className="text-sm font-medium">
                      {messages.signup.companyDescription}
                    </label>
                    <textarea
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={messages.signup.placeholders.description}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="font-medium text-foreground">
                      Recruiter compliance checklist
                    </p>
                    <p>
                      Recruiters must verify work-permit eligibility where applicable, keep
                      student hiring within Taiwan law, and avoid discriminatory job criteria.
                    </p>

                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={confirmsLawfulHiring}
                        onChange={(e) => setConfirmsLawfulHiring(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                      />
                      <span>
                        We will use this platform only for lawful hiring and recruitment-related
                        outreach.
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={confirmsNoDiscrimination}
                        onChange={(e) => setConfirmsNoDiscrimination(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                      />
                      <span>
                        We will not post or request discriminatory criteria based on nationality,
                        race, place of origin, or other prohibited categories unless legally
                        justified.
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={confirmsWorkAuthorizationChecks}
                        onChange={(e) =>
                          setConfirmsWorkAuthorizationChecks(e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                      />
                      <span>
                        We understand students may need valid Taiwan work authorization and
                        semester hour limits may apply. We will verify eligibility before hiring.
                      </span>
                    </label>

                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      By finishing onboarding, you confirm the checklist above and agree to the{" "}
                      <Link href="/terms-of-service" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      !name.trim() ||
                      !password.trim() ||
                      !confirmsLawfulHiring ||
                      !confirmsNoDiscrimination ||
                      !confirmsWorkAuthorizationChecks ||
                      loading
                    }
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {messages.signup.creatingAccount}
                      </>
                    ) : (
                      messages.signup.finishSignup
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
