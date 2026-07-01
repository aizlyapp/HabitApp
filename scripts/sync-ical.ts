#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envLocalPath });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
}

import { calendarSyncService } from '../lib/services/calendar-sync.service';

interface CliArgs {
    integrationId?: string;
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
        if (arg.startsWith('--integration-id=')) parsed.integrationId = arg.split('=')[1];
        else if (arg.startsWith('--user-id=')) parsed.userId = arg.split('=')[1];
        else if (arg.startsWith('--property-id=')) parsed.propertyId = arg.split('=')[1];
        else if (arg.startsWith('--ical-url=')) parsed.icalUrl = arg.split('=')[1];
        else if (arg.startsWith('--source=')) parsed.source = arg.split('=')[1] as CliArgs['source'];
        else if (arg === '--all') parsed.all = true;
        else if (arg === '--test') parsed.test = true;
    }
    return parsed;
}

async function main() {
    const args = parseArgs();
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('Missing NEXT_PUBLIC_SUPABASE_URL'); process.exit(1);
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1);
        }

        if (args.all) {
            console.log('Syncing all integrations...');
            const result = await calendarSyncService.syncAllIntegrations();
            console.log(`Total: ${result.total}, OK: ${result.successful}, Failed: ${result.failed}`);
            result.results.forEach((r: any) => {
                console.log(`  ${r.success ? '✅' : '❌'} ${r.integrationId || r.propertyId}: +${r.eventsAdded} ~${r.eventsUpdated} -${r.eventsRemoved}`);
            });
        } else if (args.integrationId && args.icalUrl && args.source) {
            console.log(`Syncing integration ${args.integrationId}...`);
            const result = await calendarSyncService.syncIntegration(
                args.userId || 'SYSTEM',
                args.integrationId,
                args.icalUrl,
                args.source
            );
            console.log(`Success: ${result.success}, Added: ${result.eventsAdded}, Updated: ${result.eventsUpdated}, Removed: ${result.eventsRemoved}`);
        } else if (args.propertyId && args.icalUrl && args.source) {
            console.log(`Syncing property ${args.propertyId} (legacy mode)...`);
            const result = await calendarSyncService.syncIntegrationLegacy(
                args.userId || 'SYSTEM',
                args.propertyId,
                args.icalUrl,
                args.source
            );
            console.log(`Success: ${result.success}, Added: ${result.eventsAdded}, Updated: ${result.eventsUpdated}, Removed: ${result.eventsRemoved}`);
        } else {
            console.log(`
Usage:
  --integration-id=<id> --ical-url=<url> --source=<source>   Sync a specific integration
  --property-id=<id> --ical-url=<url> --source=<source>      Sync a property (legacy)
  --all                                                      Sync all auto-sync integrations
  --test                                                     Test mode
            `);
        }
    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
}

main();