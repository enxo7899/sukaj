'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { PropertyDialog } from './property-dialog';
import { fshiProne, perditesoProne } from './actions';
import { toast } from 'sonner';
import { formatCurrency, formatAlbanianDate } from '@/lib/utils';

interface PropertiesTableProps {
  initialData: Property[];
  searchParams: { q?: string; grupi?: string; shkalla?: string; type?: string };
}

export function PropertiesTable({ initialData, searchParams }: PropertiesTableProps) {
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState(initialData);
  const [search, setSearch] = useState(searchParams.q || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paguar' | 'Pa Paguar'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const handleAdd = () => {
    setEditingProperty(null);
    setDialogOpen(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, emertimi: string) => {
    if (!confirm(`A jeni i sigurt që dëshironi të fshini "${emertimi}"?`)) {
      return;
    }

    const result = await fshiProne(id);
    if (result.success) {
      toast.success('U fshi me sukses');
      setProperties(properties.filter(p => p.id !== id));
    } else {
      toast.error('Diçka shkoi keq');
    }
  };

  const handleStatusChange = async (property: Property, newStatus: 'Paguar' | 'Pa Paguar') => {
    if (newStatus === property.status) return; // No change
    
    const result = await perditesoProne(
      property.id, 
      { status: newStatus, data_qirase: property.data_qirase },
      property.status
    );
    
    if (result.success) {
      toast.success(`Statusi u ndryshua në "${newStatus}"`);
      // Reload to get updated data (including auto-incremented date)
      window.location.reload();
    } else {
      toast.error('Diçka shkoi keq');
    }
  };

  useEffect(() => {
    setProperties(initialData);
  }, [initialData]);

  useEffect(() => {
    setSearch(searchParams.q || '');
  }, [searchParams.q]);

  const filteredProperties = properties
    .filter(
      p =>
        (search === '' ||
          p.emertimi.toLowerCase().includes(search.toLowerCase()) ||
          p.emri_qiraxhiut?.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === 'all' || p.status === statusFilter)
    )
    // Sort by status: Paguar first when filtering by Paguar, Pa Paguar first otherwise
    .sort((a, b) => {
      if (statusFilter === 'Paguar') {
        // When filtering by Paguar, show Paguar first
        if (a.status === 'Paguar' && b.status !== 'Paguar') return -1;
        if (a.status !== 'Paguar' && b.status === 'Paguar') return 1;
      } else if (statusFilter === 'Pa Paguar') {
        // When filtering by Pa Paguar, show Pa Paguar first
        if (a.status === 'Pa Paguar' && b.status !== 'Pa Paguar') return -1;
        if (a.status !== 'Pa Paguar' && b.status === 'Pa Paguar') return 1;
      } else {
        // When showing all, show Pa Paguar first (unpaid need attention)
        if (a.status === 'Pa Paguar' && b.status !== 'Pa Paguar') return -1;
        if (a.status !== 'Pa Paguar' && b.status === 'Pa Paguar') return 1;
      }
      // Secondary sort by property name
      return a.emertimi.localeCompare(b.emertimi, 'sq');
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border/20 bg-card/35 px-4 py-5 shadow-[0_25px_50px_-40px_rgba(23,128,217,0.55)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kërko..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'Paguar' | 'Pa Paguar') => setStatusFilter(value)}
          >
            <SelectTrigger className="h-11 w-full sm:w-[180px]">
              <SelectValue placeholder="Filtro sipas statusit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha</SelectItem>
              <SelectItem value="Pa Paguar">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Pa Paguar
                </span>
              </SelectItem>
              <SelectItem value="Paguar">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  Paguar
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={handleAdd} className="h-11 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Shto pronë</span>
            <span className="sm:hidden">Shto</span>
          </Button>
        )}
      </div>

      {filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            S'ka të dhëna
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Shtoni pronën e parë për të filluar
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/15 bg-card/25 shadow-[0_30px_80px_-60px_rgba(15,110,207,0.6)] backdrop-blur-xl">
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-auto">
            <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Emërtimi</TableHead>
                <TableHead className="min-w-[130px]">Status</TableHead>
                <TableHead className="min-w-[200px]">Grupi</TableHead>
                <TableHead className="min-w-[100px]">Shkalla</TableHead>
                <TableHead className="min-w-[170px]">Qiraxhiu</TableHead>
                <TableHead className="min-w-[140px]">Tel.</TableHead>
                <TableHead className="min-w-[120px]">OSHEE</TableHead>
                <TableHead className="min-w-[120px]">UKT</TableHead>
                <TableHead className="min-w-[140px]">Qera mujore</TableHead>
                <TableHead className="min-w-[140px]">Data e qirasë</TableHead>
                <TableHead className="min-w-[140px] text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-semibold text-lg tracking-tight text-foreground">{property.emertimi}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant={property.status === 'Paguar' ? 'success' : 'destructive'}
                          className="cursor-pointer shadow-none"
                        >
                          {property.status}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(property, 'Pa Paguar')}
                          className="flex items-center gap-2"
                        >
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          Pa Paguar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(property, 'Paguar')}
                          className="flex items-center gap-2"
                        >
                          <div className="h-2 w-2 rounded-full bg-green-600" />
                          Paguar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    {property.grupi && (
                      <Badge variant="outline" className="tracking-[0.1em]">
                        {property.grupi}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {property.shkalla && (
                      <Badge variant="secondary" className="tracking-[0.1em]">
                        {property.shkalla}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{property.emri_qiraxhiut || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground/90">{property.tel_qiraxhiut || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground/90">{property.oshee || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground/90">{property.ukt || '-'}</TableCell>
                  <TableCell>
                    {property.qera_mujore
                      ? formatCurrency(property.qera_mujore, property.monedha || 'EUR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-base text-muted-foreground/80">
                    {formatAlbanianDate(property.data_qirase)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(property)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(property.id, property.emertimi)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!isAdmin && (
                        <span className="text-xs text-muted-foreground px-2">
                          Vetëm admin mund të ndryshojë
                        </span>
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

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={editingProperty}
        onSuccess={() => {
          setDialogOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
