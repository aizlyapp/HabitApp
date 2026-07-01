import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calendarSyncService } from '@/lib/services/calendar-sync.service';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { propertyId, icalUrl, source } = body;

        if (!propertyId || !icalUrl || !source) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: propertyId, icalUrl, source' },
                { status: 400 }
            );
        }

        const validSources = ['Airbnb', 'Booking', 'VRBO', 'Custom'];
        if (!validSources.includes(source)) {
            return NextResponse.json(
                { error: `Fuente inválida. Usar: ${validSources.join(', ')}` },
                { status: 400 }
            );
        }

        const result = await calendarSyncService.syncPropertyICal(
            user.id,
            propertyId,
            icalUrl,
            source
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in POST /api/ical/sync:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const propertyId = searchParams.get('propertyId');

        if (!propertyId) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro propertyId' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('property_sync_config')
            .select('*')
            .eq('user_id', user.id)
            .eq('property_id', propertyId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ configured: false });
            }
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