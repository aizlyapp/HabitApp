import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCalendarSyncService } from '@/lib/services/calendar-sync.service';

// POST /api/ical/sync - Sync a single integration or property
// Body: { integrationId, propertyId, icalUrl, source }
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await request.json();
        const { integrationId, propertyId, icalUrl, source } = body;

        if (integrationId) {
            if (!icalUrl || !source) {
                return NextResponse.json({ error: 'Faltan campos: integrationId, icalUrl, source' }, { status: 400 });
            }
            const result = await getCalendarSyncService().syncIntegration(user.id, integrationId, icalUrl, source);
            return NextResponse.json(result);
        }

        if (!propertyId || !icalUrl || !source) {
            return NextResponse.json(
                { error: 'Faltan campos: integrationId, icalUrl, source (o propertyId, icalUrl, source)' },
                { status: 400 }
            );
        }

        const validSources = ['Airbnb', 'Booking', 'VRBO', 'Custom'];
        if (!validSources.includes(source)) {
            return NextResponse.json({ error: `Fuente inválida. Usar: ${validSources.join(', ')}` }, { status: 400 });
        }

        const result = await getCalendarSyncService().syncIntegrationLegacy(user.id, propertyId, icalUrl, source);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in POST /api/ical/sync:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// GET /api/ical/sync?integrationId=... or ?propertyId=...
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const integrationId = searchParams.get('integrationId');
        const propertyId = searchParams.get('propertyId');

        if (integrationId) {
            const { data, error } = await supabase
                .from('integrations')
                .select('*, integration_rooms(room_id)')
                .eq('user_id', user.id)
                .eq('id', integrationId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return NextResponse.json({ configured: false });
                throw error;
            }
            return NextResponse.json({ configured: true, integration: data });
        }

        if (!propertyId) {
            // Return all integrations for this user
            const { data } = await supabase
                .from('integrations')
                .select('*, integration_rooms(room_id)')
                .eq('user_id', user.id);
            return NextResponse.json(data || []);
        }

        // Legacy: check property_sync_config
        const { data, error } = await supabase
            .from('property_sync_config')
            .select('*')
            .eq('user_id', user.id)
            .eq('property_id', propertyId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return NextResponse.json({ configured: false });
            throw error;
        }
        return NextResponse.json({ configured: true, config: data });
    } catch (error) {
        console.error('Error in GET /api/ical/sync:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        );
    }
}