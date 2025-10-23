import { Suspense } from 'react';
import { KontratatTable } from './contracts-table';
import { listoKontratat } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

export default async function KontratatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams;
  const kontratat = await listoKontratat(params);

  return (
    <div className="flex h-full flex-col gap-6 bg-gradient-to-br from-background/85 via-background/90 to-background/70">
      <div className="border-b border-border/20 bg-card/35 backdrop-blur-xl">
        <div className="px-4 md:px-10 py-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Kontratat
          </h1>
          <p className="mt-2 text-base text-muted-foreground/80">
            {kontratat.length} {kontratat.length === 1 ? 'kontratë' : 'kontrata'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-6 md:px-10 md:py-8">
        <Suspense fallback={<TableSkeleton /> }>
          <KontratatTable initialData={kontratat} searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-full rounded-xl bg-card/45" />
      <Skeleton className="h-[400px] w-full rounded-2xl bg-card/35" />
    </div>
  );
}
