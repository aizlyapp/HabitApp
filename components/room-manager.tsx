'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Sparkles,
  AlertTriangle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Room, RoomType, CleaningStatus } from '@/lib/data/types';
import * as repo from '@/lib/data/repository';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n/context';
import { queryKeys } from '@/lib/data/queries';

const tipoOptions: RoomType[] = ['Habitación', 'Departamento', 'Cabaña', 'Suite', 'Dormitorio'];

const cleaningIcons: Record<string, React.ReactNode> = {
  clean: <Sparkles className="h-3.5 w-3.5 text-emerald-400" />,
  dirty: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />,
  'in-progress': <Clock className="h-3.5 w-3.5 text-amber-400" />,
};

interface RoomFormData {
  nombre: string;
  tipo: RoomType;
  precioPorNoche: string;
  capacidad: string;
  permiteMascotas: boolean;
  esPrivada: boolean;
}

const emptyForm: RoomFormData = {
  nombre: '',
  tipo: 'Habitación',
  precioPorNoche: '',
  capacidad: '',
  permiteMascotas: false,
  esPrivada: true,
};

interface RoomManagerProps {
  rooms: Room[];
}

export function RoomManager({ rooms }: RoomManagerProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { t } = useTranslation();
  const cleaningLabels: Record<string, string> = {
    clean: t('roomManager.limpia'),
    dirty: t('roomManager.sucia'),
    'in-progress': t('roomManager.enLimpieza'),
  };
  const tipoLabel = (tipo: string): string => {
    switch (tipo) {
      case 'Habitación': return t('roomManager.tipoHabitacion');
      case 'Departamento': return t('roomManager.tipoDepartamento');
      case 'Cabaña': return t('roomManager.tipoCabania');
      case 'Suite': return t('roomManager.tipoSuite');
      case 'Dormitorio': return t('roomManager.tipoDormitorio');
      default: return tipo;
    }
  };
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, [supabase]);

  const openCreate = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      nombre: room.nombre,
      tipo: room.tipo,
      precioPorNoche: String(room.precioPorNoche),
      capacidad: String(room.capacidad),
      permiteMascotas: room.permiteMascotas,
      esPrivada: room.esPrivada,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      const roomData = {
        ...form,
        capacidad: Number(form.capacidad) || 1,
        precioPorNoche: Number(form.precioPorNoche) || 0,
      };
      if (editingRoom) {
        await repo.updateRoom(userId, editingRoom.id, {
          ...editingRoom,
          ...roomData,
        });
      } else {
        await repo.insertRoom(userId, roomData);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roomManager.errorGuardar'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!userId) return;
    if (!confirm(t('roomManager.confirmarEliminar', { name: room.nombre }))) return;
    try {
      await repo.removeRoom(userId, room.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('roomManager.errorEliminar'));
    }
  };

  const set = (field: keyof RoomFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4 lg:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">{t('roomManager.title')}</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            {t('roomManager.subtitle', { count: rooms.length })}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-sky-600 text-white hover:bg-sky-700 shrink-0 h-9 sm:h-10 px-3 sm:px-4">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">{t('roomManager.nuevaHabitacion')}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{t('roomManager.nombre')}</TableHead>
                <TableHead className="hidden md:table-cell text-zinc-400">{t('roomManager.tipo')}</TableHead>
                <TableHead className="text-zinc-400">{t('roomManager.precioNoche')}</TableHead>
                <TableHead className="text-zinc-400">{t('roomManager.capacidad')}</TableHead>
                <TableHead className="hidden md:table-cell text-zinc-400 text-center">{t('roomManager.privada')}</TableHead>
                <TableHead className="text-zinc-400">{t('roomManager.estado')}</TableHead>
                <TableHead className="text-zinc-400">{t('roomManager.limpieza')}</TableHead>
                <TableHead className="text-zinc-400 text-right">{t('roomManager.acciones')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-white">{room.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                      {tipoLabel(room.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    ${room.precioPorNoche.toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell className="text-zinc-300">{room.capacidad} pers.</TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <span className={room.esPrivada ? 'text-emerald-400' : 'text-zinc-600'}>
                      {room.esPrivada ? t('roomManager.si') : t('roomManager.no')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        room.status === 'available'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : room.status === 'occupied'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                      }
                    >
                      {room.status === 'available'
                        ? t('roomManager.disponible')
                        : room.status === 'occupied'
                          ? t('roomManager.ocupada')
                          : t('roomManager.mantenimiento')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5" title={cleaningLabels[room.cleaning_status]}>
                      {cleaningIcons[room.cleaning_status]}
                      <span className="text-xs text-zinc-500">{cleaningLabels[room.cleaning_status]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(room)}
                        className="h-12 w-12 lg:h-9 lg:w-9 text-zinc-400 hover:text-white hover:bg-zinc-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(room)}
                        className="h-12 w-12 lg:h-9 lg:w-9 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-zinc-500">
                    {t('roomManager.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingRoom ? t('roomManager.editarHabitacion') : t('roomManager.nuevaHabitacionTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-zinc-300">{t('roomManager.nombreLabel')}</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder={t('roomManager.nombrePlaceholder')}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-zinc-300">{t('roomManager.tipoLabel')}</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => set('tipo', v as RoomType)}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-800">
                  {tipoOptions.map((tipo) => (
                    <SelectItem key={tipo} value={tipo} className="text-white hover:bg-zinc-700">
                      {tipoLabel(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio" className="text-zinc-300">{t('roomManager.precioLabel')}</Label>
                <Input
                  id="precio"
                  type="number"
                  min={0}
                  value={form.precioPorNoche}
                  onChange={(e) => set('precioPorNoche', e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad" className="text-zinc-300">{t('roomManager.capacidadLabel')}</Label>
                <Input
                  id="capacidad"
                  type="number"
                  min={1}
                  value={form.capacidad}
                  onChange={(e) => set('capacidad', e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mascotas" className="text-zinc-300">{t('roomManager.mascotasLabel')}</Label>
                <Switch
                  id="mascotas"
                  checked={form.permiteMascotas}
                  onCheckedChange={(v) => set('permiteMascotas', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="privada" className="text-zinc-300">{t('roomManager.privadaLabel')}</Label>
                <Switch
                  id="privada"
                  checked={form.esPrivada}
                  onCheckedChange={(v) => set('esPrivada', v)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {t('roomManager.cancelar')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.nombre}
                className="flex-1 bg-sky-600 text-white hover:bg-sky-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('roomManager.guardando')}
                  </>
                ) : editingRoom ? (
                  t('roomManager.guardarCambios')
                ) : (
                  t('roomManager.crearHabitacion')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
