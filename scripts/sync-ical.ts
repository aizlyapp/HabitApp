#!/usr/bin/env node

/**
 * Standalone iCal sync script
 * 
 * Usage:
 *   npx tsx scripts/sync-ical.ts --user-id=<user_id> --property-id=<property_id> --ical-url=<url> --source=<source>
 *   npx tsx scripts/sync-ical.ts --all  (syncs all auto-sync properties)
 *   npx tsx scripts/sync-ical.ts --test  (test with hardcoded values)
 */

import { calendarSyncService } from '../lib/services/calendar-sync.service';

interface CliArgs {
    userId?: string;
    propertyId?: string;
    icalUrl?: string;
    source?: 'Airbnb' | 'Booking' | 'VRBO' | 'Custom';
    all?: boolean;
    test?: boolean;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    const parsed: CliArgs = {};

    for (const arg of args) {
        if (arg.startsWith('--user-id=')) {
            parsed.userId = arg.split('=')[1];
        } else if (arg.startsWith('--property-id=')) {
            parsed.propertyId = arg.split('=')[1];
        } else if (arg.startsWith('--ical-url=')) {
            parsed.icalUrl = arg.split('=')[1];
        } else if (arg.startsWith('--source=')) {
            parsed.source = arg.split('=')[1] as CliArgs['source'];
        } else if (arg === '--all') {
            parsed.all = true;
        } else if (arg === '--test') {
            parsed.test = true;
        }
    }

    return parsed;
}

async function syncAll() {
    console.log('🔄 Starting bulk iCal sync...');
    const result = await calendarSyncService.syncAllProperties();

    console.log('\n=== Sync Summary ===');
    console.log(`Total properties: ${result.totalProperties}`);
    console.log(`Successful: ${result.successfulSyncs}`);
    console.log(`Failed: ${result.failedSyncs}`);
    console.log(`Duration: ${new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()}ms\n`);

    if (result.results.length > 0) {
        console.log('Details:');
        result.results.forEach((r) => {
            const status = r.success ? '✅' : '❌';
            console.log(`  ${status} ${r.propertyId}: +${r.eventsAdded} ~${r.eventsUpdated} -${r.eventsRemoved} ${r.error ? `(${r.error})` : ''}`);
        });
    }

    process.exit(result.failedSyncs > 0 ? 1 : 0);
}

async function syncProperty(userId: string, propertyId: string, icalUrl: string, source: 'Airbnb' | 'Booking' | 'VRBO' | 'Custom') {
    console.log(`🔄 Syncing property ${propertyId} (${source})...`);
    const result = await calendarSyncService.syncPropertyICal(userId, propertyId, icalUrl, source);

    console.log('\n=== Sync Result ===');
    console.log(`Success: ${result.success}`);
    console.log(`Added: ${result.eventsAdded}`);
    console.log(`Updated: ${result.eventsUpdated}`);
    console.log(`Removed: ${result.eventsRemoved}`);
    console.log(`Synced at: ${result.syncedAt}`);
    if (result.error) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
    }

    process.exit(0);
}

async function testSync() {
    console.log('🧪 Test mode - using hardcoded values');
    console.log('WARNING: Update these values before running!\n');

    const userId = 'USER_UUID_HERE';
    const propertyId = 'PROPERTY_UUID_HERE';
    const icalUrl = 'https://www.airbnb.com/calendar/ical/XXXXXX.ics';
    const source = 'Airbnb' as const;

    if (userId === 'USER_UUID_HERE') {
        console.error('❌ Please update userId, propertyId, icalUrl, and source in the script first.');
        process.exit(1);
    }

    await syncProperty(userId, propertyId, icalUrl, source);
}

async function main() {
    const args = parseArgs();

    try {
        // Check required environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('❌ Missing environment variables:');
            console.error('  - NEXT_PUBLIC_SUPABASE_URL');
            console.error('  - SUPABASE_SERVICE_ROLE_KEY');
            process.exit(1);
        }

        if (args.test) {
            await testSync();
        } else if (args.all) {
            await syncAll();
        } else if (args.userId && args.propertyId && args.icalUrl && args.source) {
            await syncProperty(args.userId, args.propertyId, args.icalUrl, args.source);
        } else {
            console.log('Roomy iCal Sync Script\n');
            console.log('Usage:');
            console.log('  npx tsx scripts/sync-ical.ts --user-id=<id> --property-id=<id> --ical-url=<url> --source=<Airbnb|Booking|VRBO|Custom>');
            console.log('  npx tsx scripts/sync-ical.ts --all  (syncs all auto-sync properties)');
            console.log('  npx tsx scripts/sync-ical.ts --test  (test mode)\n');
            console.log('Examples:');
            console.log('  npx tsx scripts/sync-ical.ts --all');
            console.log('  npx tsx scripts/sync-ical.ts --user-id=123 --property-id=456 --ical-url=https://...ics --source=Airbnb');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Script error:', error);
        process.exit(1);
    }
}

main();