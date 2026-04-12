"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  User,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

type Profile = {
  name: string;
  email: string;
  major: string;
  skills: string[];
  cvLink: string;
  description: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [cvLink, setCvLink] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data) => {
        const p = data.profile;
        setProfile(p);
        setName(p.name);
        setMajor(p.major);
        setSkills(p.skills);
        setCvLink(p.cvLink);
        setDescription(p.description);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          major: major.trim(),
          skills,
          cvLink: cvLink.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader className="items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-xl font-bold">My Profile</h1>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Skills</label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
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
                          onClick={() =>
                            setSkills(skills.filter((x) => x !== s))
                          }
                        >
                          {s}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cv" className="text-sm font-medium">
                    CV Link (Google Drive)
                  </label>
                  <Input
                    id="cv"
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
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <Separator />

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Profile updated!
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving || !name.trim() || !cvLink.trim()}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
