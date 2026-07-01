import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IntegrationsManager } from '@/components/integrations-manager';

export default async function IntegrationsPage() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-zinc-800 p-4 lg:p-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-white">Integraciones</h1>
                    <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                        Gestioná la sincronización de calendarios con Airbnb, Booking, VRBO y más
                    </p>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 lg:p-6">
                <IntegrationsManager userId={user.id} />
            </div>
        </div>
    );
}