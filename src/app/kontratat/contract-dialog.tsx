'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Kontrate } from '@/types/kontrate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { krijoKontrate, perditesoKontrate } from './actions';

const kontrateSchema = z.object({
  nr_repert: z.string().nullable().optional(),
  nr_koleks: z.string().nullable().optional(),
  qera_dhenes: z.string().nullable().optional(),
  qera_marres: z.string().nullable().optional(),
  nr_apartament: z.string().nullable().optional(),
  m2: z.number().nullable().optional(),
  dyqane: z.string().nullable().optional(),
  vendi: z.string().nullable().optional(),
  fillimi_kontrates: z.string().nullable().optional(), // YYYY-MM-DD
  mbarimi_kontrates: z.string().nullable().optional(), // YYYY-MM-DD
  vlera_bruto: z.number().nullable().optional(),
  monedha_bruto: z.string().nullable().optional(),
  vlera_neto: z.number().nullable().optional(),
  monedha_neto: z.string().nullable().optional(),
  garanci: z.number().nullable().optional(),
  monedha_garanci: z.string().nullable().optional(),
  kontrate_drita: z.string().nullable().optional(),
  kontrate_uji: z.string().nullable().optional(),
});

type KontrateFormValues = z.infer<typeof kontrateSchema>;

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kontrate: Kontrate | null;
  onSuccess: () => void;
}

export function ContractDialog({ open, onOpenChange, kontrate, onSuccess }: ContractDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<KontrateFormValues>({
    resolver: zodResolver(kontrateSchema),
    defaultValues: {
      nr_repert: null,
      nr_koleks: null,
      qera_dhenes: null,
      qera_marres: null,
      nr_apartament: null,
      m2: null,
      dyqane: null,
      vendi: null,
      fillimi_kontrates: null,
      mbarimi_kontrates: null,
      vlera_bruto: null,
      monedha_bruto: 'EUR',
      vlera_neto: null,
      monedha_neto: 'EUR',
      garanci: null,
      monedha_garanci: 'EUR',
      kontrate_drita: null,
      kontrate_uji: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (kontrate) {
        reset({
          nr_repert: kontrate.nr_repert ?? null,
          nr_koleks: kontrate.nr_koleks ?? null,
          qera_dhenes: kontrate.qera_dhenes ?? null,
          qera_marres: kontrate.qera_marres ?? null,
          nr_apartament: kontrate.nr_apartament ?? null,
          m2: kontrate.m2 ?? null,
          dyqane: kontrate.dyqane ?? null,
          vendi: kontrate.vendi ?? null,
          fillimi_kontrates: kontrate.fillimi_kontrates ?? null,
          mbarimi_kontrates: kontrate.mbarimi_kontrates ?? null,
          vlera_bruto: kontrate.vlera_bruto ?? null,
          monedha_bruto: kontrate.monedha_bruto ?? 'EUR',
          vlera_neto: kontrate.vlera_neto ?? null,
          monedha_neto: kontrate.monedha_neto ?? 'EUR',
          garanci: kontrate.garanci ?? null,
          monedha_garanci: kontrate.monedha_garanci ?? 'EUR',
          kontrate_drita: kontrate.kontrate_drita ?? null,
          kontrate_uji: kontrate.kontrate_uji ?? null,
        });
      } else {
        reset();
      }
    }
  }, [open, kontrate, reset]);

  const onSubmit = async (data: KontrateFormValues) => {
    const payload = { ...data };
    const res = kontrate
      ? await perditesoKontrate(kontrate.id, payload)
      : await krijoKontrate(payload);

    if (res.success) {
      toast.success(kontrate ? 'U përditësua me sukses' : 'U ruajt me sukses');
      onSuccess();
    } else {
      toast.error('Diçka shkoi keq');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kontrate ? 'Redakto kontratë' : 'Shto kontratë të re'}</DialogTitle>
          <DialogDescription>Plotësoni të dhënat e kontratës.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qera_dhenes">Qera-dhënës</Label>
              <Input id="qera_dhenes" placeholder="Emri i qera-dhënësit" {...register('qera_dhenes')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qera_marres">Qera-marrës</Label>
              <Input id="qera_marres" placeholder="Emri i qera-marrësit" {...register('qera_marres')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nr_apartament">Nr. Apartament</Label>
              <Input id="nr_apartament" placeholder="p.sh. D23-4-23" {...register('nr_apartament')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="m2">M2</Label>
              <Input id="m2" type="number" step="0.01" placeholder="0" {...register('m2', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dyqane">Dyqane</Label>
              <Input id="dyqane" placeholder="p.sh. Supermarket" {...register('dyqane')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendi">Vendi</Label>
              <Input id="vendi" placeholder="p.sh. Tiranë" {...register('vendi')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fillimi_kontrates">Fillimi i kontratës</Label>
              <Input id="fillimi_kontrates" type="date" {...register('fillimi_kontrates')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mbarimi_kontrates">Mbarimi i kontratës</Label>
              <Input id="mbarimi_kontrates" type="date" {...register('mbarimi_kontrates')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vlera_bruto">Vlera Bruto</Label>
              <Input id="vlera_bruto" type="number" step="0.01" placeholder="0.00" {...register('vlera_bruto', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monedha_bruto">Monedha (Bruto)</Label>
              <Select
                value={watch('monedha_bruto') || 'EUR'}
                onValueChange={(v) => setValue('monedha_bruto', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vlera_neto">Vlera Neto</Label>
              <Input id="vlera_neto" type="number" step="0.01" placeholder="0.00" {...register('vlera_neto', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monedha_neto">Monedha (Neto)</Label>
              <Select
                value={watch('monedha_neto') || 'EUR'}
                onValueChange={(v) => setValue('monedha_neto', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garanci">Garanci</Label>
              <Input id="garanci" type="number" step="0.01" placeholder="0.00" {...register('garanci', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monedha_garanci">Monedha (Garanci)</Label>
              <Select
                value={watch('monedha_garanci') || 'EUR'}
                onValueChange={(v) => setValue('monedha_garanci', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kontrate_drita">Kontratë Drita</Label>
              <Input id="kontrate_drita" placeholder="Kodi i kontratës së dritave" {...register('kontrate_drita')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kontrate_uji">Kontratë Uji</Label>
              <Input id="kontrate_uji" placeholder="Kodi i kontratës së ujit" {...register('kontrate_uji')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nr_repert">Nr. Repert.</Label>
              <Input id="nr_repert" placeholder="Nr. Repertor" {...register('nr_repert')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nr_koleks">Nr. Koleks.</Label>
              <Input id="nr_koleks" placeholder="Nr. Koleksion" {...register('nr_koleks')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anulo
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Duke ruajtur...' : 'Ruaj'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
