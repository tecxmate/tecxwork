import { redirect } from "next/navigation";

// The pipeline lives inside the recruiter dashboard as a native tab, reusing the
// app's top bar, language switcher, and shell. Keep /pipeline as a shortcut.
export default function PipelineRedirect() {
  redirect("/dashboard/pipeline");
}
