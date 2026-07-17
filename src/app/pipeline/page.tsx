import { getPipelineBoard } from "@/lib/pipeline-data";
import { PipelineBoard } from "./pipeline-board";

// Always render fresh — the board reflects live stage changes.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "揚運 Yang Luck · 招募看板 ATS Pipeline",
};

export default async function PipelinePage() {
  const board = await getPipelineBoard();

  if (!board || board.jobs.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9fd] p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-[#3A1C71]">揚運 Yang Luck</h1>
          <p className="mt-2 text-sm text-neutral-500">
            No pipeline data yet. Seed the demo database first.
          </p>
        </div>
      </main>
    );
  }

  return <PipelineBoard board={board} />;
}
