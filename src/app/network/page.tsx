"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Professional {
  id: number;
  name: string;
  company: string;
  jobTitle: string;
  industry: string;
  bio: string;
  graduatedFrom: string | null;
  graduationYear: number | null;
  isVerified: boolean;
  referralCount: number;
}

export default function NetworkPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/professionals")
      .then((res) => res.json())
      .then((data) => setProfessionals(data.professionals || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = professionals.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q) ||
      p.jobTitle.toLowerCase().includes(q) ||
      p.industry.toLowerCase().includes(q)
    );
  });

  const handleRequestReferral = async () => {
    if (!selectedProfessional || !requestMessage.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/referral-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: selectedProfessional.id,
          message: requestMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to send request");
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedProfessional(null);
        setRequestMessage("");
        setSubmitSuccess(false);
      }, 2000);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-heading text-xl font-bold">
            TECXWORK
          </Link>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/get-started">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Professional Network</h1>
          <p className="mt-2 text-muted-foreground">
            Connect with Vietnamese professionals who can refer you to employers
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, company, or industry..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">No professionals found</h2>
            <p className="mt-1 text-muted-foreground">
              {professionals.length === 0
                ? "Be the first to join our network!"
                : "Try adjusting your search."}
            </p>
            <Link href="/professional/signup" className="mt-4 inline-block">
              <Button>Join as Professional</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((professional) => (
              <Card
                key={professional.id}
                className="p-4 transition-all hover:shadow-lg hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{professional.name}</h3>
                      {professional.isVerified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {professional.jobTitle}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {professional.referralCount} referrals
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    {professional.company}
                  </p>
                  <p className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    {professional.industry}
                  </p>
                  {professional.graduatedFrom && (
                    <p className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {professional.graduatedFrom}
                      {professional.graduationYear &&
                        ` (${professional.graduationYear})`}
                    </p>
                  )}
                </div>

                {professional.bio && (
                  <p className="mt-3 text-sm line-clamp-2">{professional.bio}</p>
                )}

                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => setSelectedProfessional(professional)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Request Referral
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Are you a working professional?
          </p>
          <Link href="/professional/signup">
            <Button variant="link" className="text-primary">
              Join as a Professional Mentor →
            </Button>
          </Link>
        </div>
      </main>

      <Dialog
        open={!!selectedProfessional}
        onOpenChange={() => {
          setSelectedProfessional(null);
          setRequestMessage("");
          setSubmitError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Referral</DialogTitle>
          </DialogHeader>

          {submitSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
              <p className="font-semibold">Request Sent!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedProfessional?.name} will review your request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">{selectedProfessional?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedProfessional?.jobTitle} at{" "}
                  {selectedProfessional?.company}
                </p>
              </div>

              {submitError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Why should they refer you?
                </label>
                <Textarea
                  placeholder="Introduce yourself and explain why you'd be a good referral..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about your background and goals.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleRequestReferral}
                disabled={submitting || !requestMessage.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
