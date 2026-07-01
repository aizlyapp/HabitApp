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
    integration_id: string | null;
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
    integration_id?: string | null;
}

// Global integration (replaces per-property sync config)
export interface Integration {
    id: string;
    user_id: string;
    ical_url: string;
    source: ExternalReservationSource;
    label: string;
    auto_sync: boolean;
    last_sync_at: string | null;
    last_sync_status: 'success' | 'error' | 'pending' | null;
    last_sync_error: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    rooms?: IntegrationRoom[];
}

// Junction table: integration → rooms
export interface IntegrationRoom {
    id: string;
    integration_id: string;
    room_id: string;
    created_at: string;
    // Joined fields
    room_name?: string;
}

// Property sync configuration (legacy, kept for backward compatibility)
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

// Combined reservation (local + external) for unified view
export interface CombinedReservation {
    id: string;
    source: 'local' | 'external';
    room_id: string;
    property_id?: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    guest_count?: number;
    check_in: string;
    check_out: string;
    total_amount?: number;
    status: string;
    payment_status?: string;
    notes?: string | null;
    external_source?: ExternalReservationSource;
    external_uid?: string;
    ical_url?: string;
    created_at: string;
}