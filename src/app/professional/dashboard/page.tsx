"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReferralRequest {
  id: number;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  applicantMajor: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface Referral {
  id: number;
  applicantName: string;
  applicantEmail: string;
  relationship: string;
  endorsement: string;
  createdAt: string;
}

interface Profile {
  id: number;
  name: string;
  company: string;
  jobTitle: string;
  referralCount: number;
  isVerified: boolean;
}

export default function ProfessionalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [endorsement, setEndorsement] = useState("");
  const [relationship, setRelationship] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/professionals/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setRequests(data.requests || []);
      setReferrals(data.referrals || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespond = async (
    requestId: number,
    action: "accept" | "reject"
  ) => {
    if (action === "accept" && (!endorsement || !relationship)) {
      return;
    }

    try {
      const res = await fetch(`/api/referral-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          endorsement: action === "accept" ? endorsement : undefined,
          relationship: action === "accept" ? relationship : undefined,
        }),
      });

      if (res.ok) {
        setRespondingTo(null);
        setEndorsement("");
        setRelationship("");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to respond:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-heading text-xl font-bold">
            TECXWORK
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{profile?.name}</h1>
            {profile?.isVerified && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {profile?.jobTitle} at {profile?.company}
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile?.referralCount}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{referrals.length}</p>
                <p className="text-sm text-muted-foreground">Active Referrals</p>
              </div>
            </div>
          </Card>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Referral Requests</h2>
          {pendingRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No pending requests</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Students will appear here when they request your referral
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{request.applicantName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.applicantEmail} · {request.applicantMajor}
                      </p>
                      <p className="mt-2 text-sm">{request.message}</p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  </div>

                  {respondingTo === request.id ? (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="space-y-2">
                        <Label>How do you know this person? *</Label>
                        <Input
                          placeholder="e.g., Former classmate, Mentee, Colleague"
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Your endorsement *</Label>
                        <Textarea
                          placeholder="Write a brief endorsement for this student..."
                          value={endorsement}
                          onChange={(e) => setEndorsement(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRespond(request.id, "accept")}
                          disabled={!endorsement || !relationship}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Submit Referral
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setRespondingTo(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setRespondingTo(request.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Write Referral
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(request.id, "reject")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Your Referrals</h2>
          {referrals.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Students you refer will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <Card key={referral.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{referral.applicantName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {referral.relationship}
                      </p>
                      <p className="mt-2 text-sm italic">
                        &ldquo;{referral.endorsement}&rdquo;
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
