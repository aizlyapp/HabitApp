'use client';

import { useState, useEffect } from 'react';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Plus,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
    Globe,
    Trash2,
    Link2,
    ExternalLink,
} from 'lucide-react';
import type { ExternalReservationSource } from '@/lib/data/ical-types';

interface IntegrationItem {
    id: string;
    label: string;
    ical_url: string;
    source: ExternalReservationSource;
    auto_sync: boolean;
    last_sync_at: string | null;
    last_sync_status: 'success' | 'error' | 'pending' | null;
    last_sync_error: string | null;
    integration_rooms?: { room_id: string }[];
}

interface RoomOption {
    id: string;
    nombre: string;
}

export function IntegrationsManager({ userId }: { userId: string }) {
    const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        icalUrl: '',
        source: 'Custom' as ExternalReservationSource,
        label: '',
        roomIds: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [integrationsRes, roomsRes] = await Promise.all([
                fetch('/api/ical/sync'),
                fetch('/api/rooms'),
            ]);
            const integrationsData = await integrationsRes.json();
            const roomsData = await roomsRes.json();
            setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
            setRooms(Array.isArray(roomsData) ? roomsData : []);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveIntegration = async () => {
        if (!form.icalUrl.trim()) {
            setError('La URL iCal es requerida');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            // 1. Create the integration
            const supabase = (await import('@/lib/supabase/client')).createClient();
            const { data: integration, error: integrationError } = await supabase
                .from('integrations')
                .insert({
                    user_id: userId,
                    ical_url: form.icalUrl.trim(),
                    source: form.source,
                    label: form.label || form.source,
                    auto_sync: true,
                })
                .select()
                .single();

            if (integrationError) throw integrationError;

            // 2. Map rooms
            if (form.roomIds.length > 0) {
                const roomEntries = form.roomIds.map((roomId) => ({
                    integration_id: integration.id,
                    room_id: roomId,
                }));
                const { error: roomsError } = await supabase
                    .from('integration_rooms')
                    .insert(roomEntries);
                if (roomsError) throw roomsError;
            }

            // 3. Sync immediately
            await fetch('/api/ical/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId: integration.id,
                    icalUrl: form.icalUrl.trim(),
                    source: form.source,
                }),
            });

            setDialogOpen(false);
            setForm({ icalUrl: '', source: 'Custom', label: '', roomIds: [] });
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async (integration: IntegrationItem) => {
        setSyncingId(integration.id);
        try {
            await fetch('/api/ical/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId: integration.id,
                    icalUrl: integration.ical_url,
                    source: integration.source,
                }),
            });
            await loadData();
        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setSyncingId(null);
        }
    };

    const handleDeleteIntegration = async (integration: IntegrationItem) => {
        if (!confirm(`¿Eliminar integración "${integration.label}"?`)) return;
        try {
            const supabase = (await import('@/lib/supabase/client')).createClient();
            await supabase.from('integrations').delete().eq('id', integration.id);
            await loadData();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const getStatusBadge = (status: string | null) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            success: { label: 'Sincronizado', class: 'bg-emerald-500/20 text-emerald-400' },
            error: { label: 'Error', class: 'bg-rose-500/20 text-rose-400' },
            pending: { label: 'Pendiente', class: 'bg-amber-500/20 text-amber-400' },
        };
        const s = statusMap[status || ''] || { label: 'Nunca', class: 'bg-zinc-500/20 text-zinc-400' };
        return <Badge variant="outline" className={`${s.class} border-0`}>{s.label}</Badge>;
    };

    const sourceColors: Record<string, string> = {
        Airbnb: 'text-rose-400 bg-rose-500/10',
        Booking: 'text-blue-400 bg-blue-500/10',
        VRBO: 'text-amber-400 bg-amber-500/10',
        Custom: 'text-zinc-400 bg-zinc-500/10',
    };

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Integraciones</h2>
                    <p className="text-sm text-zinc-400">Conectá tus calendarios de Airbnb, Booking y más</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-sky-600 text-white hover:bg-sky-700">
                    <Plus className="h-4 w-4" />
                    Nueva Integración
                </Button>
            </div>

            {integrations.length === 0 && (
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="flex flex-col items-center gap-4 py-12">
                        <Globe className="h-12 w-12 text-zinc-600" />
                        <p className="text-zinc-500">No hay integraciones configuradas</p>
                        <Button onClick={() => setDialogOpen(true)} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                            Agregar primera integración
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {integrations.map((integration) => (
                    <Card key={integration.id} className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${sourceColors[integration.source] || sourceColors.Custom}`}>
                                            {integration.source}
                                        </span>
                                        <span className="text-sm font-medium text-white">{integration.label}</span>
                                        {getStatusBadge(integration.last_sync_status)}
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate max-w-md">{integration.ical_url}</p>
                                    <div className="flex items-center gap-2">
                                        <Link2 className="h-3 w-3 text-zinc-500" />
                                        <span className="text-xs text-zinc-400">
                                            {integration.integration_rooms?.length || 0} habitación(es)
                                        </span>
                                    </div>
                                    {integration.last_sync_at && (
                                        <p className="text-xs text-zinc-600">
                                            Última sync: {new Date(integration.last_sync_at).toLocaleString('es-AR')}
                                        </p>
                                    )}
                                    {integration.last_sync_error && (
                                        <p className="text-xs text-rose-500">{integration.last_sync_error}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleSync(integration)}
                                        disabled={syncingId === integration.id}
                                        className="h-8 w-8 text-zinc-400 hover:text-white"
                                    >
                                        {syncingId === integration.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteIntegration(integration)}
                                        className="h-8 w-8 text-rose-500 hover:text-rose-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Nueva Integración</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {error && (
                            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400 text-sm">{error}</div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Plataforma</Label>
                            <Select value={form.source} onValueChange={(v: any) => setForm({ ...form, source: v })}>
                                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-zinc-800 bg-zinc-800">
                                    <SelectItem value="Airbnb" className="text-white hover:bg-zinc-700">Airbnb</SelectItem>
                                    <SelectItem value="Booking" className="text-white hover:bg-zinc-700">Booking</SelectItem>
                                    <SelectItem value="VRBO" className="text-white hover:bg-zinc-700">VRBO</SelectItem>
                                    <SelectItem value="Custom" className="text-white hover:bg-zinc-700">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Etiqueta (opcional)</Label>
                            <Input
                                value={form.label}
                                onChange={(e) => setForm({ ...form, label: e.target.value })}
                                placeholder="Ej: Airbnb Principal"
                                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">URL iCal</Label>
                            <Input
                                value={form.icalUrl}
                                onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
                                placeholder="https://www.airbnb.com/calendar/ical/..."
                                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <Separator className="bg-zinc-800" />
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Habitaciones vinculadas</Label>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {rooms.map((room) => (
                                    <label key={room.id} className="flex items-center gap-2 rounded border border-zinc-800 p-2 hover:bg-zinc-800/50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.roomIds.includes(room.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setForm({ ...form, roomIds: [...form.roomIds, room.id] });
                                                } else {
                                                    setForm({ ...form, roomIds: form.roomIds.filter((id) => id !== room.id) });
                                                }
                                            }}
                                            className="accent-sky-600"
                                        />
                                        <span className="text-sm text-white">{room.nombre}</span>
                                    </label>
                                ))}
                                {rooms.length === 0 && <p className="text-xs text-zinc-500">No hay habitaciones disponibles</p>}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveIntegration}
                                disabled={saving || !form.icalUrl.trim()}
                                className="flex-1 bg-sky-600 text-white hover:bg-sky-700"
                            >
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar y Sincronizar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}