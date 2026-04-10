"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  X,
} from "lucide-react";

type Step = "form" | "availability" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [major, setMajor] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [cvLink, setCvLink] = useState("");
  const [description, setDescription] = useState("");
  const [pipaConsent, setPipaConsent] = useState(false);

  // Created profile
  const [profileId, setProfileId] = useState<number | null>(null);

  const canSubmit =
    name.trim() &&
    email.trim() &&
    password.length >= 6 &&
    cvLink.trim() &&
    pipaConsent;

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          major: major.trim(),
          skills,
          cvLink: cvLink.trim(),
          description: description.trim(),
          pipaConsent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setProfileId(data.profile.id);
      setStep("availability");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSlots() {
    if (!profileId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applicant-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: profileId,
          date: "2026-05-15",
          startHour: 9,
          endHour: 17,
          durationMinutes: 15,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create slots");

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-heading text-xl font-semibold">
              Registration Complete!
            </h2>
            <p className="text-sm text-muted-foreground">
              Your profile is now visible to recruiters. They can browse your
              profile and book an interview with you.
            </p>
            <Separator />
            <p className="text-xs text-muted-foreground">
              You can also browse companies and book interviews yourself.
            </p>
            <Button onClick={() => router.push("/browse")} className="mt-2">
              Browse Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "availability") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center gap-2">
            <h2 className="font-heading text-xl font-semibold">
              Set Your Availability
            </h2>
            <p className="text-sm text-muted-foreground">
              This creates 15-minute interview slots on event day (May 15, 2026)
              from 9:00 AM to 5:00 PM for recruiters to book.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button
              onClick={handleCreateSlots}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating slots...
                </>
              ) : (
                "Create Availability (9 AM – 5 PM)"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep("done")}
              className="w-full"
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-xl font-bold">
                Applicant Registration
              </h1>
              <p className="text-sm text-muted-foreground">
                Create your profile so recruiters can find and book you.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu.tw"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-password" className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="reg-password"
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
                  <label htmlFor="major" className="text-sm font-medium">
                    Major / Department
                  </label>
                  <Input
                    id="major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Skills</label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSkill}
                    >
                      Add
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skills.map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="cursor-pointer gap-1"
                          onClick={() => removeSkill(s)}
                        >
                          {s}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cv-link" className="text-sm font-medium">
                    CV Link (Google Drive){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="cv-link"
                    type="url"
                    required
                    value={cvLink}
                    onChange={(e) => setCvLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="desc" className="text-sm font-medium">
                    About You
                  </label>
                  <textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief introduction..."
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <Separator />

                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <input
                    id="pipa"
                    type="checkbox"
                    checked={pipaConsent}
                    onChange={(e) => setPipaConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
                    required
                  />
                  <label
                    htmlFor="pipa"
                    className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
                  >
                    <ShieldCheck className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
                    I consent to making my profile and CV link visible to
                    recruiters for this recruitment event in accordance with
                    Taiwan&apos;s Personal Data Protection Act.
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
