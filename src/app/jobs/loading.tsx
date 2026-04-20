import { Skeleton } from "@/components/ui/skeleton";

export default function JobsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </header>

      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <Skeleton className="mx-auto mb-4 h-6 w-24" />
          <Skeleton className="mx-auto h-10 w-80 sm:h-12" />
          <Skeleton className="mx-auto mt-3 h-5 w-96" />
        </div>
      </section>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-4 w-32" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
