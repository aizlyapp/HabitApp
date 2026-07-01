import { NextRequest, NextResponse } from 'next/server';
import { calendarSyncService } from '@/lib/services/calendar-sync.service';

/**
 * Cron endpoint for automatic iCal synchronization
 * Triggered by Vercel Cron Jobs every 15 minutes
 * 
 * Security: Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
    try {
        // Verify this is a legitimate cron request
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔄 Starting scheduled iCal sync...');
        const startedAt = new Date();

        // Sync all auto-sync properties
        const result = await calendarSyncService.syncAllProperties();

        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();

        console.log(`✅ iCal sync completed in ${durationMs}ms:`, {
            total: result.totalProperties,
            successful: result.successfulSyncs,
            failed: result.failedSyncs,
        });

        // Store summary in response headers for monitoring
        const response = NextResponse.json(result);
        response.headers.set('X-Sync-Duration', durationMs.toString());
        response.headers.set('X-Sync-Total', result.totalProperties.toString());
        response.headers.set('X-Sync-Success', result.successfulSyncs.toString());
        response.headers.set('X-Sync-Failed', result.failedSyncs.toString());

        return response;
    } catch (error) {
        console.error('❌ Critical error in cron sync:', error);
        return NextResponse.json(
            {
                error: 'Critical cron error',
                message: error instanceof Error ? error.message : 'Unknown error',
                totalProperties: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                results: [],
            },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint for manual trigger (for testing)
 * WARNING: Remove or protect this in production
 */
export async function GET(request: NextRequest) {
    // In production, you might want to check for a query param secret
    const searchParams = request.nextUrl.searchParams;
    const manualTrigger = searchParams.get('trigger');

    if (manualTrigger !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return POST(request);
}