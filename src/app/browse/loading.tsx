import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">V-GEN</span>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </header>
      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <Skeleton className="mx-auto h-5 w-20" />
          <Skeleton className="mx-auto mt-3 h-8 w-64 sm:h-10" />
          <Skeleton className="mx-auto mt-2 h-4 w-48" />
        </div>
      </section>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-4 h-9 w-full max-w-sm" />
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-4 h-4 w-24" />
                <div className="mt-2 flex gap-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="mt-4 h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
