import ical from 'node-ical';
import { createClient } from '@supabase/supabase-js';
import type {
    ExternalReservation,
    ExternalReservationInput,
    PropertySyncConfig,
    Integration,
    IntegrationRoom,
    ICalEvent,
    SyncResult,
    BulkSyncResult,
    ExternalReservationSource,
} from '@/lib/data/ical-types';

export class CalendarSyncService {
    private supabase: ReturnType<typeof createClient>;

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
        if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

        this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }

    parseICal(icalContent: string): ICalEvent[] {
        const events: ICalEvent[] = [];
        const parsed = ical.parseICS(icalContent);
        for (const [key, value] of Object.entries(parsed)) {
            if (value && value.type === 'VEVENT') {
                const event = value as any;
                const startDate = this.extractDate(event.start);
                const endDate = this.extractDate(event.end);
                if (!startDate || !endDate) continue;
                events.push({
                    uid: event.uid?.val || key,
                    startDate,
                    endDate,
                    summary: event.summary?.val || 'Reserva Externa',
                    description: event.description?.val,
                    location: event.location?.val,
                    status: this.normalizeStatus(event.status?.val || 'CONFIRMED'),
                    sequence: parseInt(event.sequence?.val || '0'),
                    rawData: event,
                });
            }
        }
        return events;
    }

    async fetchICalFromUrl(url: string, timeoutMs: number = 30000): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Roomy-iCal-Sync/1.0', 'Accept': 'text/calendar,application/octet-stream,*/*' },
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = await response.text();
        if (!content.includes('BEGIN:VEVENT') && !content.includes('BEGIN:vEVENT')) {
            throw new Error('Invalid iCal: no VEVENT found');
        }
        return content;
    }

    async syncIntegration(
        userId: string,
        integrationId: string,
        icalUrl: string,
        source: ExternalReservationSource
    ): Promise<{
        success: boolean;
        integrationId: string;
        eventsAdded: number;
        eventsUpdated: number;
        eventsRemoved: number;
        error?: string;
        syncedAt: string;
    }> {
        const startedAt = new Date().toISOString();
        let eventsAdded = 0, eventsUpdated = 0, eventsRemoved = 0;
        let error: string | undefined;

        try {
            // Get the rooms mapped to this integration
            const { data: integrationRooms, error: roomsError } = await (this.supabase as any)
                .from('integration_rooms')
                .select('room_id')
                .eq('integration_id', integrationId);

            if (roomsError) throw new Error(`Failed to fetch integration rooms: ${roomsError.message}`);

            const roomIds: string[] = (integrationRooms || []).map((r: any) => r.room_id);
            if (roomIds.length === 0) {
                throw new Error('No rooms mapped to this integration');
            }

            const icalContent = await this.fetchICalFromUrl(icalUrl);
            const parsedEvents = this.parseICal(icalContent);

            // Sync for each room
            for (const propertyId of roomIds) {
                // Get existing external reservations for this property
                const { data: existingReservations, error: fetchError } = await (this.supabase as any)
                    .from('external_reservations')
                    .select('*')
                    .eq('property_id', propertyId)
                    .eq('user_id', userId) as { data: ExternalReservation[] | null; error: any };

                if (fetchError) {
                    console.error(`Failed to fetch reservations for room ${propertyId}:`, fetchError);
                    continue;
                }

                const reservations = existingReservations || [];
                const existingMap = new Map<string, ExternalReservation>(
                    reservations.map((r: any) => [`${r.property_id}-${r.external_uid}-${r.source}`, r])
                );

                const seenUids = new Set<string>();

                for (const event of parsedEvents) {
                    const key = `${propertyId}-${event.uid}-${source}`;
                    seenUids.add(key);

                    const eventData: ExternalReservationInput = {
                        property_id: propertyId,
                        user_id: userId,
                        external_uid: event.uid,
                        source,
                        integration_id: integrationId,
                        start_date: event.startDate.toISOString().split('T')[0],
                        end_date: event.endDate.toISOString().split('T')[0],
                        guest_name: event.summary || null,
                        guest_email: null,
                        guest_phone: null,
                        total_amount: null,
                        status: event.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
                        sync_token: event.sequence?.toString() || null,
                        raw_ical_data: event.rawData,
                    };

                    const existing = existingMap.get(key);
                    if (existing) {
                        const needsUpdate =
                            existing.start_date !== eventData.start_date ||
                            existing.end_date !== eventData.end_date ||
                            existing.status !== eventData.status;
                        if (needsUpdate) {
                            const { error: updateError } = await (this.supabase as any)
                                .from('external_reservations')
                                .update(eventData)
                                .eq('id', existing.id);
                            if (updateError) console.error(`Update failed: ${updateError.message}`);
                            else eventsUpdated++;
                        }
                    } else {
                        const { error: insertError } = await (this.supabase as any)
                            .from('external_reservations')
                            .insert(eventData);
                        if (insertError) console.error(`Insert failed: ${insertError.message}`);
                        else eventsAdded++;
                    }
                }

                // Delete events no longer in iCal
                for (const [key, existing] of Array.from(existingMap.entries())) {
                    if (!seenUids.has(key)) {
                        const { error: deleteError } = await (this.supabase as any)
                            .from('external_reservations')
                            .delete()
                            .eq('id', existing.id);
                        if (deleteError) console.error(`Delete failed: ${deleteError.message}`);
                        else eventsRemoved++;
                    }
                }
            }

            // Update integration last sync timestamp
            await (this.supabase as any)
                .from('integrations')
                .update({
                    last_sync_at: startedAt,
                    last_sync_status: 'success',
                    last_sync_error: null,
                })
                .eq('id', integrationId);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error';
            try {
                await (this.supabase as any)
                    .from('integrations')
                    .update({
                        last_sync_at: startedAt,
                        last_sync_status: 'error',
                        last_sync_error: error,
                    })
                    .eq('id', integrationId);
            } catch (e) {
                console.error('Failed to update sync status:', e);
            }
        }

        return { success: !error, integrationId, eventsAdded, eventsUpdated, eventsRemoved, error, syncedAt: startedAt };
    }

    async syncIntegrationLegacy(
        userId: string,
        propertyId: string,
        icalUrl: string,
        source: ExternalReservationSource
    ): Promise<{
        success: boolean;
        propertyId: string;
        eventsAdded: number;
        eventsUpdated: number;
        eventsRemoved: number;
        error?: string;
        syncedAt: string;
    }> {
        const startedAt = new Date().toISOString();
        let eventsAdded = 0, eventsUpdated = 0, eventsRemoved = 0;
        let error: string | undefined;
        try {
            const icalContent = await this.fetchICalFromUrl(icalUrl);
            const parsedEvents = this.parseICal(icalContent);
            const { data: existingReservations } = await (this.supabase as any)
                .from('external_reservations')
                .select('*')
                .eq('property_id', propertyId)
                .eq('user_id', userId) as { data: ExternalReservation[] | null };
            const existingMap = new Map<string, ExternalReservation>(
                (existingReservations || []).map((r: any) => [`${r.property_id}-${r.external_uid}-${r.source}`, r])
            );
            const seenUids = new Set<string>();
            for (const event of parsedEvents) {
                const key = `${propertyId}-${event.uid}-${source}`;
                seenUids.add(key);
                const eventData: ExternalReservationInput = {
                    property_id: propertyId, user_id: userId,
                    external_uid: event.uid, source,
                    start_date: event.startDate.toISOString().split('T')[0],
                    end_date: event.endDate.toISOString().split('T')[0],
                    guest_name: event.summary || null, guest_email: null, guest_phone: null,
                    total_amount: null,
                    status: event.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
                    sync_token: event.sequence?.toString() || null, raw_ical_data: event.rawData,
                };
                const existing = existingMap.get(key);
                if (existing) {
                    const needsUpdate =
                        existing.start_date !== eventData.start_date ||
                        existing.end_date !== eventData.end_date ||
                        existing.status !== eventData.status;
                    if (needsUpdate) {
                        await (this.supabase as any).from('external_reservations').update(eventData).eq('id', existing.id);
                        eventsUpdated++;
                    }
                } else {
                    await (this.supabase as any).from('external_reservations').insert(eventData);
                    eventsAdded++;
                }
            }
            for (const [key, existing] of Array.from(existingMap.entries())) {
                if (!seenUids.has(key)) {
                    await (this.supabase as any).from('external_reservations').delete().eq('id', existing.id);
                    eventsRemoved++;
                }
            }
            await (this.supabase as any).from('property_sync_config').update({
                last_sync_at: startedAt, last_sync_status: 'success', last_sync_error: null,
            }).eq('property_id', propertyId).eq('user_id', userId);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error';
            try {
                await (this.supabase as any).from('property_sync_config').update({
                    last_sync_at: startedAt, last_sync_status: 'error', last_sync_error: error,
                }).eq('property_id', propertyId).eq('user_id', userId);
            } catch (e) { console.error(e); }
        }
        return { success: !error, propertyId, eventsAdded, eventsUpdated, eventsRemoved, error, syncedAt: startedAt };
    }

    async syncAllIntegrations(): Promise<{
        total: number; successful: number; failed: number; results: any[];
        startedAt: string; completedAt: string;
    }> {
        const startedAt = new Date().toISOString();
        const results: any[] = [];
        const { data: integrations } = await (this.supabase as any)
            .from('integrations')
            .select('*')
            .eq('auto_sync', true) as { data: Integration[] | null };
        if (!integrations || integrations.length === 0) {
            return { total: 0, successful: 0, failed: 0, results: [], startedAt, completedAt: new Date().toISOString() };
        }
        for (const integration of integrations) {
            const result = await this.syncIntegration(
                integration.user_id, integration.id, integration.ical_url, integration.source
            );
            results.push(result);
        }
        const successful = results.filter(r => r.success).length;
        return {
            total: integrations.length, successful, failed: results.length - successful,
            results, startedAt, completedAt: new Date().toISOString()
        };
    }

    private extractDate(dateObj: any): Date | null {
        if (!dateObj) return null;
        if (dateObj instanceof Date) return dateObj;
        if (dateObj.year && dateObj.month && dateObj.day) return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
        if (dateObj.icalString) {
            const str = dateObj.icalString;
            if (str.length === 8) return new Date(parseInt(str.substring(0, 4)), parseInt(str.substring(4, 6)) - 1, parseInt(str.substring(6, 8)));
        }
        return null;
    }

    private normalizeStatus(status: string): 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE' {
        const s = status.toUpperCase();
        if (['CANCELLED', 'CANCELED'].includes(s)) return 'CANCELLED';
        if (s === 'TENTATIVE') return 'TENTATIVE';
        return 'CONFIRMED';
    }
}

let calendarSyncServiceInstance: CalendarSyncService | null = null;

export function getCalendarSyncService(): CalendarSyncService {
    if (!calendarSyncServiceInstance) {
        calendarSyncServiceInstance = new CalendarSyncService();
    }
    return calendarSyncServiceInstance;
}