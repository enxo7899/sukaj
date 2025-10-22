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
    <div className="flex h-full flex-col gap-6 bg-gradient-to-br from-background via-background/95 to-background/80">
      <div className="border-b border-border/15 bg-card/30 backdrop-blur-xl">
        <div className="px-4 md:px-8 py-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {getTitle()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground/80 md:text-base">
            {properties.length} {properties.length === 1 ? 'pronë' : 'prona'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-4 md:px-8 md:py-6">
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
      <Skeleton className="h-12 w-full rounded-xl bg-card/40" />
      <Skeleton className="h-[400px] w-full rounded-2xl bg-card/30" />
    </div>
  );
}
