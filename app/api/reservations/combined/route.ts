import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchCombinedReservations } from '@/lib/data/repository';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const reservations = await fetchCombinedReservations(user.id);

        return NextResponse.json({ reservations });
    } catch (error) {
        console.error('Error in GET /api/reservations/combined:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        );
    }
}