import type { ReservationStatus, PaymentStatus, RoomStatus, CleaningStatus } from './types';

// External reservation stored in the database
export interface ExternalReservation {
    id: string;
    property_id: string;
    user_id: string;
    external_uid: string;
    source: ExternalReservationSource;
    start_date: string;
    end_date: string;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    total_amount: number | null;
    status: ExternalReservationStatus;
    sync_token: string | null;
    raw_ical_data: any;
    created_at: string;
    updated_at: string;
}

export type ExternalReservationSource = 'Airbnb' | 'Booking' | 'VRBO' | 'Custom';
export type ExternalReservationStatus = 'confirmed' | 'cancelled';

// Input for creating/updating external reservations
export interface ExternalReservationInput {
    property_id: string;
    user_id: string;
    external_uid: string;
    source: ExternalReservationSource;
    start_date: string;
    end_date: string;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    total_amount?: number | null;
    status?: ExternalReservationStatus;
    sync_token?: string | null;
    raw_ical_data?: any;
}

// Property sync configuration
export interface PropertySyncConfig {
    id: string;
    property_id: string;
    user_id: string;
    ical_url: string;
    source: ExternalReservationSource;
    auto_sync: boolean;
    sync_interval_minutes: number;
    last_sync_at: string | null;
    last_sync_status: 'success' | 'error' | 'pending' | null;
    last_sync_error: string | null;
    created_at: string;
    updated_at: string;
}

// Parsed iCal event
export interface ICalEvent {
    uid: string;
    startDate: Date;
    endDate: Date;
    summary: string;
    description?: string;
    location?: string;
    status?: 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE';
    sequence?: number;
    rawData?: any;
}

// Sync result for a single property
export interface SyncResult {
    success: boolean;
    propertyId: string;
    source: ExternalReservationSource;
    eventsAdded: number;
    eventsUpdated: number;
    eventsRemoved: number;
    error?: string;
    syncedAt: string;
}

// Combined sync result for all properties
export interface BulkSyncResult {
    totalProperties: number;
    successfulSyncs: number;
    failedSyncs: number;
    results: SyncResult[];
    startedAt: string;
    completedAt: string;
}

// Availability check result combining local and external reservations
export interface RealAvailabilityResult {
    available: boolean;
    conflictingReservations: Array<{
        id: string;
        source: 'local' | 'external';
        start_date: string;
        end_date: string;
        guest_name?: string;
        status: string;
    }>;
}

// Cron job status
export interface CronJobStatus {
    isRunning: boolean;
    lastRun: string | null;
    nextRun: string | null;
    totalPropertiesConfigured: number;
    avgSyncDurationMs: number;
}