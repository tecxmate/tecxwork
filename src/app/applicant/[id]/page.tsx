import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  FileText,
  GraduationCap,
  Globe,
  Link2,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteFooter } from "@/components/site-footer";
import { db, applicantProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

type WorkExperience = {
  company: string;
  title: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  summary: string;
};

async function getApplicant(id: number) {
  const [applicant] = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      phone: applicantProfiles.phone,
      nationality: applicantProfiles.nationality,
      schoolName: applicantProfiles.schoolName,
      schoolNameEn: applicantProfiles.schoolNameEn,
      major: applicantProfiles.major,
      studyLevel: applicantProfiles.studyLevel,
      studyYear: applicantProfiles.studyYear,
      expectedGraduation: applicantProfiles.expectedGraduation,
      jobSeekingStatus: applicantProfiles.jobSeekingStatus,
      workAuthorization: applicantProfiles.workAuthorization,
      skills: applicantProfiles.skills,
      preferredLocations: applicantProfiles.preferredLocations,
      preferredIndustries: applicantProfiles.preferredIndustries,
      workExperiences: applicantProfiles.workExperiences,
      cvLink: applicantProfiles.cvLink,
      linkedinUrl: applicantProfiles.linkedinUrl,
      portfolioUrl: applicantProfiles.portfolioUrl,
      avatarUrl: applicantProfiles.avatarUrl,
      description: applicantProfiles.description,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, id))
    .limit(1);

  return applicant ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "recruiter" && session?.role !== "admin") {
    return { title: "Applicant Profile | TECXWORK" };
  }

  const { id } = await params;
  const applicant = await getApplicant(parseInt(id));
  if (!applicant) return { title: "Applicant Not Found" };
  return {
    title: `${applicant.name} | TECXWORK`,
    description: applicant.description?.slice(0, 160) || `${applicant.name} - ${applicant.major}`,
  };
}

export default async function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "recruiter" && session.role !== "admin") redirect("/login");

  const applicant = await getApplicant(parseInt(id));

  if (!applicant) notFound();

  const backHref = session.role === "admin" ? "/admin/applicants" : "/dashboard/applicants";

  const workExperiences = (applicant.workExperiences as WorkExperience[]) || [];
  const school = applicant.schoolNameEn
    ? `${applicant.schoolName} / ${applicant.schoolNameEn}`
    : applicant.schoolName;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader className="gap-4 pb-4">
              <div className="flex items-start gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
                  {applicant.avatarUrl ? (
                    <Image
                      src={applicant.avatarUrl}
                      alt={applicant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-heading text-2xl font-bold">{applicant.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {applicant.major} · {applicant.studyLevel}
                  </p>
                  {school && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      {school}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {applicant.description && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    About
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{applicant.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a href={`mailto:${applicant.email}`} className="hover:underline">
                      {applicant.email}
                    </a>
                  </p>
                </div>
                {applicant.expectedGraduation && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Graduation (expected)
                    </p>
                    <p className="text-sm">{applicant.expectedGraduation}</p>
                  </div>
                )}
                {applicant.nationality && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Nationality</p>
                    <p className="text-sm">{applicant.nationality}</p>
                  </div>
                )}
                {applicant.workAuthorization && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Work Authorization</p>
                    <p className="text-sm">{applicant.workAuthorization}</p>
                  </div>
                )}
              </div>

              {applicant.skills && applicant.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Skills
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {applicant.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {applicant.preferredLocations && applicant.preferredLocations.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preferred Locations
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {applicant.preferredLocations.map((loc) => (
                      <Badge key={loc} variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {applicant.preferredIndustries && applicant.preferredIndustries.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preferred Industries
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {applicant.preferredIndustries.map((ind) => (
                      <Badge key={ind} variant="outline" className="gap-1">
                        <Briefcase className="h-3 w-3" />
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {workExperiences.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Work Experience
                    </h2>
                    <div className="mt-3 space-y-4">
                      {workExperiences.map((exp, index) => (
                        <div key={index} className="rounded-lg border border-border/60 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{exp.title}</p>
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                            </div>
                            {exp.employmentType && (
                              <Badge variant="secondary" className="text-[10px]">
                                {exp.employmentType}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                          </p>
                          {exp.summary && (
                            <p className="mt-2 text-sm text-muted-foreground">{exp.summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-wrap gap-3">
                {applicant.cvLink && (
                  <a
                    href={applicant.cvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <FileText className="h-4 w-4" />
                    View CV
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {applicant.linkedinUrl && (
                  <a
                    href={applicant.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Link2 className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {applicant.portfolioUrl && (
                  <a
                    href={applicant.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Globe className="h-4 w-4" />
                    Portfolio
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
