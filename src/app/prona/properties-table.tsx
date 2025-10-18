'use client';

import { useState } from 'react';
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

  const filteredProperties = search
    ? properties.filter(
        p =>
          p.emertimi.toLowerCase().includes(search.toLowerCase()) ||
          p.emri_qiraxhiut?.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kërko sipas emërtimit ose qiraxhiut..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Shto pronë
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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emërtimi</TableHead>
                <TableHead>Grupi</TableHead>
                <TableHead>Shkalla</TableHead>
                <TableHead>Qiraxhiu</TableHead>
                <TableHead>Tel.</TableHead>
                <TableHead>OSHEE</TableHead>
                <TableHead>UKT</TableHead>
                <TableHead>Qera mujore</TableHead>
                <TableHead>Data e qirasë</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.emertimi}</TableCell>
                  <TableCell>
                    {property.grupi && (
                      <Badge variant="outline" className="text-xs">
                        {property.grupi}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {property.shkalla && (
                      <Badge variant="secondary" className="text-xs">
                        {property.shkalla}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{property.emri_qiraxhiut || '-'}</TableCell>
                  <TableCell className="text-xs">{property.tel_qiraxhiut || '-'}</TableCell>
                  <TableCell className="text-xs">{property.oshee || '-'}</TableCell>
                  <TableCell className="text-xs">{property.ukt || '-'}</TableCell>
                  <TableCell>
                    {property.qera_mujore
                      ? formatCurrency(property.qera_mujore, property.monedha || 'EUR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatAlbanianDate(property.data_qirase)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant={property.status === 'Paguar' ? 'default' : 'destructive'}
                          className="cursor-pointer"
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
