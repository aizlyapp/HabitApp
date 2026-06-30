'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import {
  Plus,
  Search,
  Upload,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  CalendarDays,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Guest } from '@/lib/data/types';
import * as repo from '@/lib/data/repository';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/data/queries';
import { useTranslation } from '@/lib/i18n/context';

interface GuestManagerProps {
  guests: Guest[];
}

function parseCSV(text: string): Omit<Guest, 'id' | 'fechaRegistro'>[] {
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const result: Omit<Guest, 'id' | 'fechaRegistro'>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    if (parts.length >= 1 && parts[0]) {
      result.push({
        nombre: parts[0],
        email: parts[1] || '',
        telefono: parts[2] || '',
      });
    }
  }
  return result;
}

export function GuestManager({ guests }: GuestManagerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, [supabase]);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q)
    );
  }, [guests, search]);

  const handleCreate = async () => {
    if (!userId || !form.nombre.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const g = await repo.insertGuest(userId, form);
      queryClient.setQueryData<Guest[]>(queryKeys.guests, (old: Guest[] | undefined) =>
        old ? [...old, g] : [g]
      );
      setDialogOpen(false);
      setForm({ nombre: '', email: '', telefono: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('guestManager.errorCrear'));
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!userId || !file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setImportResult(t('guestManager.noEncontradosCSV'));
        return;
      }
      const created = await Promise.all(parsed.map((g) => repo.insertGuest(userId, g)));
      queryClient.setQueryData<Guest[]>(queryKeys.guests, (old: Guest[] | undefined) =>
        old ? [...old, ...created] : created
      );
      setImportResult(t('guestManager.importados', { count: created.length }));
    } catch (err) {
      setImportResult(
        `Error: ${err instanceof Error ? err.message : t('guestManager.archivoInvalido')}`
      );
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-zinc-800 p-4 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">{t('guestManager.title')}</h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              {t('guestManager.subtitle', { count: guests.length })}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4"
            >
              {importing ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="text-xs sm:text-sm">{t('guestManager.importarCSV')}</span>
            </Button>
            <Button
              onClick={() => {
                setForm({ nombre: '', email: '', telefono: '' });
                setError(null);
                setDialogOpen(true);
              }}
              className="gap-1.5 sm:gap-2 bg-sky-600 text-white hover:bg-sky-700 h-9 sm:h-10 px-3 sm:px-4"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{t('guestManager.nuevoHuesped')}</span>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder={t('guestManager.buscar')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-700 bg-zinc-800 pl-9 text-white placeholder:text-zinc-500"
          />
        </div>

        {importResult && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              importResult.startsWith('Error')
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {importResult}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs sm:text-sm">{t('guestManager.nombre')}</TableHead>
                <TableHead className="hidden md:table-cell text-zinc-400 text-xs sm:text-sm">{t('guestManager.email')}</TableHead>
                <TableHead className="hidden md:table-cell text-zinc-400 text-xs sm:text-sm">{t('guestManager.telefono')}</TableHead>
                <TableHead className="hidden md:table-cell text-zinc-400 text-xs sm:text-sm">{t('guestManager.registro')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guest) => (
                <TableRow
                  key={guest.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-zinc-500" />
                      <span className="font-medium text-white capitalize">
                        {guest.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      {guest.email || (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Phone className="h-3.5 w-3.5 text-zinc-500" />
                      {guest.telefono || (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />
                      {guest.fechaRegistro
                        ? new Date(guest.fechaRegistro).toLocaleDateString('es-AR')
                        : '—'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-zinc-500"
                  >
                    {search
                      ? t('guestManager.sinResultados')
                      : t('guestManager.sinHuespedes')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t('guestManager.nuevoHuespedTitle')}
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
              <Label htmlFor="gNombre" className="text-zinc-300">
                {t('guestManager.nombreCompleto')}
              </Label>
              <Input
                id="gNombre"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder={t('guestManager.nombrePlaceholder')}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gEmail" className="text-zinc-300">
                {t('guestManager.email')}
              </Label>
              <Input
                id="gEmail"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder={t('guestManager.emailPlaceholder')}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gTelefono" className="text-zinc-300">
                {t('guestManager.telefono')}
              </Label>
              <Input
                id="gTelefono"
                value={form.telefono}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefono: e.target.value }))
                }
                placeholder={t('guestManager.telefonoPlaceholder')}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !form.nombre.trim()}
                className="flex-1 bg-sky-600 text-white hover:bg-sky-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('guestManager.guardando')}
                  </>
                ) : (
                  t('guestManager.crearHuesped')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
