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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Step = "email" | "profile";

export default function RecruiterSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [email, setEmail] = useState("");

  // Pre-filled from allowed-domain match
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 2
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [positions, setPositions] = useState<string[]>([]);

  async function handleEmailCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/recruiters/check-domain?email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");

      setCompany(data.company);
      setIndustry(data.industry);
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function addPosition() {
    const p = positionInput.trim();
    if (p && !positions.includes(p)) setPositions([...positions, p]);
    setPositionInput("");
  }

  function removePosition(pos: string) {
    setPositions(positions.filter((p) => p !== pos));
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
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
                Recruiter Signup
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === "email"
                  ? "Enter your work email to get started."
                  : "Complete your company profile."}
              </p>
            </CardHeader>
            <CardContent>
              {step === "email" ? (
                <form onSubmit={handleEmailCheck} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium">
                      Work Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourcompany.com"
                      autoComplete="email"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only pre-approved company domains can sign up. Contact
                      the event admin if your company is not listed.
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
                        Checking...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:underline"
                    >
                      Log in
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-foreground">
                        {company}
                      </p>
                      <p className="text-muted-foreground">
                        {email} &middot; {industry}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium">
                      Your Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jane Chen"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="desc" className="text-sm font-medium">
                      Company Description
                    </label>
                    <textarea
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description shown to applicants..."
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Open Positions
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={positionInput}
                        onChange={(e) => setPositionInput(e.target.value)}
                        placeholder="e.g. Software Engineer"
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
                      >
                        Add
                      </Button>
                    </div>
                    {positions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {positions.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="cursor-pointer gap-1"
                            onClick={() => removePosition(p)}
                          >
                            {p}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("email")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!name.trim() || password.length < 6 || loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
