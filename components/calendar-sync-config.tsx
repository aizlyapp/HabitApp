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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
    Globe,
} from 'lucide-react';
import type { PropertySyncConfig } from '@/lib/data/ical-types';

interface CalendarSyncConfigProps {
    propertyId: string;
    userId: string;
}

export function CalendarSyncConfig({ propertyId, userId }: CalendarSyncConfigProps) {
    const [source, setSource] = useState<string>('Custom');
    const [icalUrl, setIcalUrl] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [config, setConfig] = useState<PropertySyncConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchConfig();
    }, [propertyId, userId]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ical/sync?propertyId=${propertyId}`);
            if (!res.ok) throw new Error('Error al cargar configuración');
            const data = await res.json();
            if (data.configured) {
                setConfig(data.config);
                setSource(data.config.source);
                setIcalUrl(data.config.ical_url);
            }
        } catch (err) {
            console.error('Error fetching sync config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndSync = async () => {
        if (!icalUrl.trim()) {
            setError('La URL iCal es requerida');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/ical/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    icalUrl: icalUrl.trim(),
                    source,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al sincronizar');

            setSuccess(`Sincronización completada: +${data.eventsAdded} nuevos, ~${data.eventsUpdated} actualizados`);
            await fetchConfig();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    const handleSyncNow = async () => {
        setSyncing(true);
        setError(null);

        try {
            const res = await fetch('/api/ical/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    icalUrl: config?.ical_url || icalUrl,
                    source: config?.source || source,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al sincronizar');

            setSuccess(`Sincronización actualizada: +${data.eventsAdded} nuevos, ~${data.eventsUpdated} actualizados`);
            await fetchConfig();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setSyncing(false);
        }
    };

    const getStatusBadge = () => {
        if (!config?.last_sync_status) return null;

        const statusMap = {
            success: { label: 'Sincronizado', class: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
            error: { label: 'Error', class: 'bg-rose-500/20 text-rose-400', icon: <XCircle className="h-3 w-3" /> },
            pending: { label: 'Pendiente', class: 'bg-amber-500/20 text-amber-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
        };

        const status = statusMap[config.last_sync_status as keyof typeof statusMap] || statusMap.pending;
        return (
            <Badge variant="outline" className={`${status.class} border-0`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
            </Badge>
        );
    };

    return (
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-medium text-white">Sincronización de Calendarios</h3>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">{success}</p>
                </div>
            )}

            {!loading && config && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                    <div className="space-y-1">
                        <p className="text-xs text-zinc-400">Última sincronización</p>
                        <p className="text-sm text-white">
                            {config.last_sync_at
                                ? new Date(config.last_sync_at).toLocaleString('es-AR')
                                : 'Nunca'}
                        </p>
                    </div>
                    {getStatusBadge()}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="source" className="text-zinc-300">Fuente</Label>
                <Select value={source} onValueChange={setSource} disabled={saving || syncing}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-800">
                        <SelectItem value="Airbnb" className="text-white hover:bg-zinc-700">Airbnb</SelectItem>
                        <SelectItem value="Booking" className="text-white hover:bg-zinc-700">Booking</SelectItem>
                        <SelectItem value="VRBO" className="text-white hover:bg-zinc-700">VRBO</SelectItem>
                        <SelectItem value="Custom" className="text-white hover:bg-zinc-700">Otro (Custom)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="icalUrl" className="text-zinc-300">URL iCal</Label>
                <Input
                    id="icalUrl"
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                    disabled={saving || syncing}
                />
            </div>

            <Separator className="bg-zinc-800" />

            <div className="flex flex-col gap-2">
                <Button
                    onClick={handleSaveAndSync}
                    disabled={saving || syncing || !icalUrl.trim()}
                    className="w-full bg-sky-600 text-white hover:bg-sky-700"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        'Guardar y Sincronizar'
                    )}
                </Button>

                {config && (
                    <Button
                        onClick={handleSyncNow}
                        disabled={syncing || saving}
                        variant="outline"
                        className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                        {syncing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sincronizar ahora
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}