'use client';

import { useEffect, useState } from 'react';
import { Kontrate } from '@/types/kontrate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { ContractDialog } from './contract-dialog';
import { fshiKontrate } from './actions';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatAlbanianDate, formatCurrency } from '@/lib/utils';

interface KontratatTableProps {
  initialData: Kontrate[];
  searchParams: { q?: string };
}

export function KontratatTable({ initialData, searchParams }: KontratatTableProps) {
  const { isAdmin } = useAuth();
  const [kontratat, setKontratat] = useState(initialData);
  const [search, setSearch] = useState(searchParams.q || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Kontrate | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: Kontrate) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, label?: string | null) => {
    if (!confirm(`A jeni i sigurt që dëshironi të fshini kontratën${label ? ` për \"${label}\"` : ''}?`)) {
      return;
    }
    const res = await fshiKontrate(id);
    if (res.success) {
      toast.success('U fshi me sukses');
      setKontratat((prev) => prev.filter((k) => k.id !== id));
    } else {
      toast.error('Diçka shkoi keq');
    }
  };

  useEffect(() => {
    setKontratat(initialData);
  }, [initialData]);

  useEffect(() => {
    setSearch(searchParams.q || '');
  }, [searchParams.q]);

  const filtered = search
    ? kontratat.filter((k) =>
        [k.qera_marres, k.qera_dhenes, k.nr_apartament, k.vendi, k.nr_repert, k.nr_koleks]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : kontratat;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border/20 bg-card/35 px-4 py-5 shadow-[0_25px_50px_-40px_rgba(23,128,217,0.55)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kërko qiraxhi, dhënës, nr. apartamenti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-11"
          />
        </div>
        {isAdmin && (
          <Button onClick={handleAdd} className="h-11 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Shto kontratë</span>
            <span className="sm:hidden">Shto</span>
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">S'ka të dhëna</p>
          <p className="text-sm text-muted-foreground mt-2">Shtoni kontratën e parë për të filluar</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/15 bg-card/25 shadow-[0_30px_80px_-60px_rgba(15,110,207,0.6)] backdrop-blur-xl">
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nr. Repert.</TableHead>
                  <TableHead className="min-w-[120px]">Nr. Koleks.</TableHead>
                  <TableHead className="min-w-[180px]">Qera-dhënës</TableHead>
                  <TableHead className="min-w-[180px]">Qera-marrës</TableHead>
                  <TableHead className="min-w-[140px]">Nr. Apartament</TableHead>
                  <TableHead className="min-w-[100px]">M2</TableHead>
                  <TableHead className="min-w-[160px]">Dyqane</TableHead>
                  <TableHead className="min-w-[140px]">Vendi</TableHead>
                  <TableHead className="min-w-[140px]">Fillimi</TableHead>
                  <TableHead className="min-w-[140px]">Mbarimi</TableHead>
                  <TableHead className="min-w-[150px]">Vlera Bruto</TableHead>
                  <TableHead className="min-w-[150px]">Vlera Neto</TableHead>
                  <TableHead className="min-w-[140px]">Garanci</TableHead>
                  <TableHead className="min-w-[140px]">Drita</TableHead>
                  <TableHead className="min-w-[140px]">Uji</TableHead>
                  <TableHead className="min-w-[120px] text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.nr_repert || '-'}</TableCell>
                    <TableCell>{k.nr_koleks || '-'}</TableCell>
                    <TableCell>{k.qera_dhenes || '-'}</TableCell>
                    <TableCell>{k.qera_marres || '-'}</TableCell>
                    <TableCell>{k.nr_apartament || '-'}</TableCell>
                    <TableCell>{k.m2 ?? '-'}</TableCell>
                    <TableCell>{k.dyqane || '-'}</TableCell>
                    <TableCell>{k.vendi || '-'}</TableCell>
                    <TableCell className="text-base text-muted-foreground/80">{formatAlbanianDate(k.fillimi_kontrates)}</TableCell>
                    <TableCell className="text-base text-muted-foreground/80">{formatAlbanianDate(k.mbarimi_kontrates)}</TableCell>
                    <TableCell>
                      {k.vlera_bruto ? formatCurrency(k.vlera_bruto, k.monedha_bruto || 'EUR') : '-'}
                    </TableCell>
                    <TableCell>
                      {k.vlera_neto ? formatCurrency(k.vlera_neto, k.monedha_neto || 'EUR') : '-'}
                    </TableCell>
                    <TableCell>
                      {k.garanci ? formatCurrency(k.garanci, k.monedha_garanci || 'EUR') : '-'}
                    </TableCell>
                    <TableCell>
                      {k.kontrate_drita ? (
                        <Badge variant="outline">{k.kontrate_drita}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {k.kontrate_uji ? (
                        <Badge variant="outline">{k.kontrate_uji}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(k)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(k.id, k.qera_marres)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2">Vetëm admin mund të ndryshojë</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kontrate={editing}
        onSuccess={() => {
          setDialogOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
