import type { Metadata } from "next";

import { InterviewRoom } from "./interview-room";

/**
 * The candidate's interview, opened from a link with no account behind it.
 *
 * Nothing about the interview is rendered on the server: the page hands the
 * token to the client and every question comes from the API, which is the only
 * place the candidate-facing allow-list is applied. Server-rendering the first
 * question would mean building a second path to the same data, and the second
 * path is the one that eventually ships the answer key in the HTML.
 */
export const metadata: Metadata = {
  title: "Screening interview",
  // A link that lands in a chat app should not put the role, the company or the
  // candidate in a preview card, and a search engine has no business here at all.
  robots: { index: false, follow: false },
};

export default async function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InterviewRoom token={token} />;
}
