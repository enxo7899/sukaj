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
    <div className="flex flex-col h-full">
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">
            {getTitle()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length} {properties.length === 1 ? 'pronë' : 'prona'}
          </p>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto px-6 py-6 overflow-auto">
        <Suspense fallback={<TableSkeleton />}>
          <PropertiesTable initialData={properties} searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
