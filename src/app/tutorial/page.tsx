import { Metadata } from "next";
import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";
import { getStudentLocale } from "@/lib/student-locale.server";
import {
  StudentSectionEn,
  RecruiterSectionEn,
  AdminSectionEn,
  tutorialUiEn,
} from "./content-en";
import {
  StudentSectionVi,
  RecruiterSectionVi,
  AdminSectionVi,
  tutorialUiVi,
} from "./content-vi";
import {
  StudentSectionZh,
  RecruiterSectionZh,
  AdminSectionZh,
  tutorialUiZh,
} from "./content-zh-TW";

export const metadata: Metadata = {
  title: "Tutorials | TECXWORK",
  description: "Guides for Students, Recruiters, and Admins on the TECXWORK platform.",
};

export default async function TutorialPage() {
  const [session, locale] = await Promise.all([getSession(), getStudentLocale()]);
  const isAdmin = session?.role === "admin";

  const ui =
    locale === "vi" ? tutorialUiVi : locale === "zh-TW" ? tutorialUiZh : tutorialUiEn;
  const StudentSection =
    locale === "vi" ? StudentSectionVi : locale === "zh-TW" ? StudentSectionZh : StudentSectionEn;
  const RecruiterSection =
    locale === "vi"
      ? RecruiterSectionVi
      : locale === "zh-TW"
        ? RecruiterSectionZh
        : RecruiterSectionEn;
  const AdminSection =
    locale === "vi" ? AdminSectionVi : locale === "zh-TW" ? AdminSectionZh : AdminSectionEn;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar navRole={session?.role ?? "guest"} currentPath="/tutorial" />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold mb-2">{ui.pageTitle}</h1>
        <p className="text-muted-foreground mb-8">{ui.pageSubtitle(isAdmin)}</p>

        <div className="tutorial-shortcut-bar sticky top-[calc(env(safe-area-inset-top)+56px)] md:top-[64px] z-10 -mx-4 px-4 py-3 mb-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b transition-opacity duration-150">
          <div className="flex gap-3 overflow-x-auto">
            <a
              href="#student-guide"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium whitespace-nowrap"
            >
              {ui.studentTab}
            </a>
            <a
              href="#recruiter-guide"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium whitespace-nowrap"
            >
              {ui.recruiterTab}
            </a>
            {isAdmin ? (
              <a
                href="#admin-guide"
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium whitespace-nowrap"
              >
                {ui.adminTab}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-16">
          <StudentSection />
          <RecruiterSection />
          {isAdmin ? <AdminSection /> : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
