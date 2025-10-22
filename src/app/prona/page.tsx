import { Suspense } from 'react';
import { PropertiesTable } from './properties-table';
import { listoPronat } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

export default async function PronaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grupi?: string; shkalla?: string; type?: string }>;
}) {
  const params = await searchParams;
  const properties = await listoPronat(params);

  const getTitle = () => {
    if (params.type === 'apartamente') return 'Të gjitha apartamentet';
    if (params.grupi) return params.grupi;
    return 'Të gjitha pronat';
  };

  return (
    <div className="flex h-full flex-col gap-6 bg-gradient-to-br from-background/85 via-background/90 to-background/70">
      <div className="border-b border-border/20 bg-card/35 backdrop-blur-xl">
        <div className="px-4 md:px-10 py-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {getTitle()}
          </h1>
          <p className="mt-2 text-base text-muted-foreground/80">
            {properties.length} {properties.length === 1 ? 'pronë' : 'prona'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-6 md:px-10 md:py-8">
        <Suspense fallback={<TableSkeleton />}>
          <PropertiesTable initialData={properties} searchParams={params} />
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
