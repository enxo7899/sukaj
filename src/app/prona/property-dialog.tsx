'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Property, KNOWN_GROUPS } from '@/types/property';
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
import { krijoProne, perditesoProne } from './actions';

const propertySchema = z.object({
  emertimi: z.string().min(1, 'Emërtimi është i detyrueshëm'),
  grupi: z.string().nullable(),
  shkalla: z.string().nullable(),
  emri_qiraxhiut: z.string().nullable(),
  tel_qiraxhiut: z.string().nullable(),
  oshee: z.string().nullable(),
  ukt: z.string().nullable(),
  qera_mujore: z.number().nullable(),
  monedha: z.string().nullable(),
  data_qirase: z.string().nullable(), // Date string in YYYY-MM-DD format
  status: z.enum(['Paguar', 'Pa Paguar']),
  pershkrim: z.string().nullable(),
  adresa: z.string().nullable(),
  qyteti: z.string().nullable(),
  njesia_administrative: z.string().nullable(),
  kodi_postar: z.string().nullable(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSuccess: () => void;
}

export function PropertyDialog({
  open,
  onOpenChange,
  property,
  onSuccess,
}: PropertyDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      emertimi: '',
      grupi: null,
      shkalla: null,
      emri_qiraxhiut: null,
      tel_qiraxhiut: null,
      oshee: null,
      ukt: null,
      qera_mujore: null,
      monedha: 'EUR',
      data_qirase: null,
      status: 'Pa Paguar',
      pershkrim: null,
      adresa: null,
      qyteti: null,
      njesia_administrative: null,
      kodi_postar: null,
    },
  });

  // Reset form with property data when dialog opens
  useEffect(() => {
    if (open) {
      if (property) {
        reset({
          emertimi: property.emertimi || '',
          grupi: property.grupi || null,
          shkalla: property.shkalla || null,
          emri_qiraxhiut: property.emri_qiraxhiut || null,
          tel_qiraxhiut: property.tel_qiraxhiut || null,
          oshee: property.oshee || null,
          ukt: property.ukt || null,
          qera_mujore: property.qera_mujore || null,
          monedha: property.monedha || 'EUR',
          data_qirase: property.data_qirase || null,
          status: property.status || 'Pa Paguar',
          pershkrim: property.pershkrim || null,
          adresa: property.adresa || null,
          qyteti: property.qyteti || null,
          njesia_administrative: property.njesia_administrative || null,
          kodi_postar: property.kodi_postar || null,
        });
      } else {
        reset({
          emertimi: '',
          grupi: null,
          shkalla: null,
          emri_qiraxhiut: null,
          tel_qiraxhiut: null,
          oshee: null,
          ukt: null,
          qera_mujore: null,
          monedha: 'EUR',
          data_qirase: null,
          status: 'Pa Paguar',
          pershkrim: null,
          adresa: null,
          qyteti: null,
          njesia_administrative: null,
          kodi_postar: null,
        });
      }
    }
  }, [open, property, reset]);

  const onSubmit = async (data: PropertyFormValues) => {
    const result = property
      ? await perditesoProne(property.id, { ...data, tags: property.tags }, property.status)
      : await krijoProne({ ...data, tags: [] });

    if (result.success) {
      toast.success(property ? 'U përditësua me sukses' : 'U ruajt me sukses');
      onSuccess();
    } else {
      toast.error('Diçka shkoi keq');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {property ? 'Redakto pronë' : 'Shto pronë të re'}
          </DialogTitle>
          <DialogDescription>
            Plotësoni të dhënat e pronës. Fushat me * janë të detyrueshme.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emertimi">
                Emërtimi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emertimi"
                placeholder="p.sh. Ap. A1"
                {...register('emertimi')}
              />
              {errors.emertimi && (
                <p className="text-sm text-destructive">{errors.emertimi.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupi">Grupi</Label>
              <Select
                value={watch('grupi') || ''}
                onValueChange={(value) => setValue('grupi', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni grupin" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shkalla">Shkalla</Label>
              <Select
                value={watch('shkalla') || ''}
                onValueChange={(value) => setValue('shkalla', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni shkallën" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: 'Paguar' | 'Pa Paguar') =>
                  setValue('status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pa Paguar">Pa Paguar</SelectItem>
                  <SelectItem value="Paguar">Paguar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emri_qiraxhiut">Qiraxhiu</Label>
              <Input
                id="emri_qiraxhiut"
                placeholder="Emri dhe mbiemri"
                {...register('emri_qiraxhiut')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tel_qiraxhiut">Nr. Telefoni</Label>
              <Input
                id="tel_qiraxhiut"
                placeholder="06X XXX XXXX"
                {...register('tel_qiraxhiut')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oshee">OSHEE</Label>
              <Input id="oshee" placeholder="Kodi OSHEE" {...register('oshee')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ukt">UKT</Label>
              <Input id="ukt" placeholder="Kodi UKT" {...register('ukt')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qera_mujore">Qera mujore</Label>
              <Input
                id="qera_mujore"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('qera_mujore', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monedha">Monedha</Label>
              <Select
                value={watch('monedha') || 'EUR'}
                onValueChange={(value) => setValue('monedha', value)}
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
              <Label htmlFor="data_qirase">Data e qirasë</Label>
              <Input
                id="data_qirase"
                type="date"
                {...register('data_qirase')}
              />
              <p className="text-xs text-muted-foreground">
                Data kur duhet paguar qiraja
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresa">Adresa</Label>
              <Input id="adresa" placeholder="Adresa e pronës" {...register('adresa')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qyteti">Qyteti</Label>
              <Input id="qyteti" placeholder="Qyteti" {...register('qyteti')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="njesia_administrative">Njësia administrative</Label>
              <Input
                id="njesia_administrative"
                placeholder="Njësia administrative"
                {...register('njesia_administrative')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kodi_postar">Kodi postar</Label>
              <Input
                id="kodi_postar"
                placeholder="Kodi postar"
                {...register('kodi_postar')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pershkrim">Përshkrim</Label>
            <textarea
              id="pershkrim"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Shënime ose detaje shtesë..."
              {...register('pershkrim')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
