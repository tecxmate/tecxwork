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
  X,
} from "lucide-react";

import { RecruiterLanguageSwitcher } from "@/components/recruiter-language-switcher";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const [positionInput, setPositionInput] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [jdLink, setJdLink] = useState("");

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

  function addPosition() {
    const position = positionInput.trim();
    if (position && !positions.includes(position)) {
      setPositions([...positions, position]);
    }
    setPositionInput("");
  }

  function removePosition(position: string) {
    setPositions(positions.filter((item) => item !== position));
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
          positions,
          contactEmail: email.trim(),
          jdLink: jdLink.trim() || undefined,
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

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {messages.signup.openPositions}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={positionInput}
                        onChange={(e) => setPositionInput(e.target.value)}
                        placeholder={messages.signup.placeholders.position}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addPosition();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPosition}
                        disabled={!positionInput.trim()}
                      >
                        {messages.signup.addPosition}
                      </Button>
                    </div>
                    {positions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {positions.map((position) => (
                          <Badge
                            key={position}
                            variant="secondary"
                            className="cursor-pointer gap-1"
                          >
                            {position}
                            <button
                              type="button"
                              onClick={() => removePosition(position)}
                              aria-label={messages.dashboard.company.delete}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <label htmlFor="jd-link" className="text-sm font-medium">
                      {messages.signup.jdLink}
                    </label>
                    <Input
                      id="jd-link"
                      type="url"
                      value={jdLink}
                      onChange={(e) => setJdLink(e.target.value)}
                      placeholder={messages.signup.placeholders.jdLink}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!name.trim() || !password.trim() || loading}
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
