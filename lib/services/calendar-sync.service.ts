import ical from 'node-ical';
import { createClient } from '@supabase/supabase-js';
import type {
    ExternalReservation,
    ExternalReservationInput,
    PropertySyncConfig,
    ICalEvent,
    SyncResult,
    BulkSyncResult,
    ExternalReservationSource,
} from '@/lib/data/ical-types';

/**
 * CalendarSyncService - Handles iCal synchronization for external reservations
 * 
 * Features:
 * - Parse iCal feeds from various sources (Airbnb, Booking, VRBO)
 * - Upsert reservations (insert new, update existing)
 * - Delete reservations that no longer exist in the iCal feed
 * - Error handling per property (isolated failures)
 */
export class CalendarSyncService {
    private supabase: ReturnType<typeof createClient>;

    constructor() {
        // Read env vars at construction time so dotenv can populate them first
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) {
            throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
        }

        if (!supabaseServiceKey) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
        }

        this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    /**
     * Parse iCal content and extract events
     */
    parseICal(icalContent: string): ICalEvent[] {
        try {
            const events: ICalEvent[] = [];
            const parsed = ical.parseICS(icalContent);

            for (const [key, value] of Object.entries(parsed)) {
                if (value && value.type === 'VEVENT') {
                    const event = value as any;

                    const startDate = this.extractDate(event.start);
                    const endDate = this.extractDate(event.end);

                    if (!startDate || !endDate) {
                        console.warn(`Event ${event.uid} missing dates, skipping`);
                        continue;
                    }

                    const status = this.normalizeStatus(event.status?.val || 'CONFIRMED');
                    const summary = event.summary?.val || 'Reserva Externa';

                    events.push({
                        uid: event.uid?.val || key,
                        startDate,
                        endDate,
                        summary,
                        description: event.description?.val,
                        location: event.location?.val,
                        status,
                        sequence: parseInt(event.sequence?.val || '0'),
                        rawData: event,
                    });
                }
            }

            return events;
        } catch (error) {
            console.error('Error parsing iCal:', error);
            throw new Error(`Failed to parse iCal: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch iCal content from URL
     */
    async fetchICalFromUrl(url: string, timeoutMs: number = 30000): Promise<string> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Roomy-iCal-Sync/1.0',
                    'Accept': 'text/calendar,application/octet-stream,*/*',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();

            if (!content.includes('BEGIN:VEVENT') && !content.includes('BEGIN:vEVENT')) {
                throw new Error('Invalid iCal format: no VEVENT found');
            }

            return content;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Timeout fetching iCal after ${timeoutMs}ms`);
            }
            throw error;
        }
    }

    /**
     * Sync a single property's iCal feed
     */
    async syncPropertyICal(
        userId: string,
        propertyId: string,
        icalUrl: string,
        source: ExternalReservationSource,
        overwriteCancelled: boolean = true
    ): Promise<SyncResult> {
        const startedAt = new Date().toISOString();
        let eventsAdded = 0;
        let eventsUpdated = 0;
        let eventsRemoved = 0;
        let error: string | undefined;

        try {
            // Fetch and parse iCal
            const icalContent = await this.fetchICalFromUrl(icalUrl);
            const parsedEvents = this.parseICal(icalContent);

            // Get existing external reservations for this property
            const { data: existingReservations, error: fetchError } = await this.supabase
                .from('external_reservations')
                .select('*')
                .eq('property_id', propertyId)
                .eq('user_id', userId) as { data: ExternalReservation[] | null; error: any };

            if (fetchError) {
                throw new Error(`Failed to fetch existing reservations: ${fetchError.message}`);
            }

            const reservations = existingReservations || [];
            const existingMap = new Map<string, ExternalReservation>(
                reservations.map((r) => [`${r.property_id}-${r.external_uid}-${r.source}`, r])
            );

            const seenUids = new Set<string>();

            // Upsert events
            for (const event of parsedEvents) {
                const key = `${propertyId}-${event.uid}-${source}`;
                seenUids.add(key);

                const eventData: ExternalReservationInput = {
                    property_id: propertyId,
                    user_id: userId,
                    external_uid: event.uid,
                    source,
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
                    // Update if changed
                    const needsUpdate =
                        existing.start_date !== eventData.start_date ||
                        existing.end_date !== eventData.end_date ||
                        existing.status !== eventData.status ||
                        existing.sync_token !== eventData.sync_token;

                    if (needsUpdate) {
                        const { error: updateError } = await (this.supabase as any)
                            .from('external_reservations')
                            .update(eventData as any)
                            .eq('id', existing.id);

                        if (updateError) {
                            console.error(`Failed to update reservation ${event.uid}:`, updateError);
                        } else {
                            eventsUpdated++;
                        }
                    }
                } else {
                    // Insert new
                    const { error: insertError } = await this.supabase
                        .from('external_reservations')
                        .insert(eventData as any);

                    if (insertError) {
                        console.error(`Failed to insert reservation ${event.uid}:`, insertError);
                    } else {
                        eventsAdded++;
                    }
                }
            }

            // Delete events that no longer exist in iCal
            for (const [key, existing] of existingMap) {
                if (!seenUids.has(key)) {
                    const { error: deleteError } = await this.supabase
                        .from('external_reservations')
                        .delete()
                        .eq('id', existing.id);

                    if (deleteError) {
                        console.error(`Failed to delete removed reservation ${existing.id}:`, deleteError);
                    } else {
                        eventsRemoved++;
                    }
                }
            }

            // Update sync config timestamp
            await this.supabase
                .from('property_sync_config')
                .update({
                    last_sync_at: startedAt,
                    last_sync_status: 'success',
                    last_sync_error: null,
                })
                .eq('property_id', propertyId)
                .eq('user_id', userId);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error during sync';
            console.error(`Sync failed for property ${propertyId}:`, error);

            // Update sync config with error
            try {
                await this.supabase
                    .from('property_sync_config')
                    .update({
                        last_sync_at: startedAt,
                        last_sync_status: 'error',
                        last_sync_error: error,
                    })
                    .eq('property_id', propertyId)
                    .eq('user_id', userId);
            } catch (updateError) {
                console.error('Failed to update sync status:', updateError);
            }
        }

        return {
            success: !error,
            propertyId,
            source,
            eventsAdded,
            eventsUpdated,
            eventsRemoved,
            error,
            syncedAt: startedAt,
        };
    }

    /**
     * Sync all properties configured for auto-sync
     */
    async syncAllProperties(): Promise<BulkSyncResult> {
        const startedAt = new Date().toISOString();
        const results: SyncResult[] = [];

        // Fetch all auto-sync configurations
        const { data: configs, error: fetchError } = await this.supabase
            .from('property_sync_config')
            .select('*')
            .eq('auto_sync', true) as { data: PropertySyncConfig[] | null; error: any };

        if (fetchError) {
            console.error('Failed to fetch sync configs:', fetchError);
            return {
                totalProperties: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                results: [],
                startedAt,
                completedAt: new Date().toISOString(),
            };
        }

        if (!configs || configs.length === 0) {
            return {
                totalProperties: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                results: [],
                startedAt,
                completedAt: new Date().toISOString(),
            };
        }

        // Process each property independently (isolated failures)
        for (const config of configs) {
            try {
                const result = await this.syncPropertyICal(
                    config.user_id,
                    config.property_id,
                    config.ical_url,
                    config.source as ExternalReservationSource
                );
                results.push(result);
            } catch (error) {
                console.error(`Unexpected error syncing property ${config.property_id}:`, error);
                results.push({
                    success: false,
                    propertyId: config.property_id,
                    source: config.source as ExternalReservationSource,
                    eventsAdded: 0,
                    eventsUpdated: 0,
                    eventsRemoved: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    syncedAt: new Date().toISOString(),
                });
            }
        }

        const completedAt = new Date().toISOString();
        const successfulSyncs = results.filter((r) => r.success).length;
        const failedSyncs = results.length - successfulSyncs;

        return {
            totalProperties: configs.length,
            successfulSyncs,
            failedSyncs,
            results,
            startedAt,
            completedAt,
        };
    }

    /**
     * Helper: Extract date from iCal date object
     */
    private extractDate(dateObj: any): Date | null {
        if (!dateObj) return null;

        if (dateObj instanceof Date) {
            return dateObj;
        }

        if (dateObj.year && dateObj.month && dateObj.day) {
            return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
        }

        if (dateObj.icalString) {
            // Parse: 20250115
            const str = dateObj.icalString;
            if (str.length === 8) {
                const year = parseInt(str.substring(0, 4));
                const month = parseInt(str.substring(4, 6)) - 1;
                const day = parseInt(str.substring(6, 8));
                return new Date(year, month, day);
            }
        }

        return null;
    }

    /**
     * Helper: Normalize iCal status to our status
     */
    private normalizeStatus(status: string): 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE' {
        const normalized = status.toUpperCase();
        if (['CANCELLED', 'CANCELED'].includes(normalized)) return 'CANCELLED';
        if (normalized === 'TENTATIVE') return 'TENTATIVE';
        return 'CONFIRMED';
    }
}

export const calendarSyncService = new CalendarSyncService();