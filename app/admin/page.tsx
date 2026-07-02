import { getAllUsers, getUserStats } from '@/lib/supabase/admin-queries';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatCard } from '@/components/admin/StatCard';
import { UserTable } from '@/components/admin/UserTable';

export default async function AdminPage() {
  const [users, stats] = await Promise.all([getAllUsers(), getUserStats()]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <h1 className="text-xl font-semibold text-white">Panel de Administración</h1>
          <span className="text-xs text-zinc-500">Solo para administradores</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Estadísticas de Usuarios</h2>
          <p className="text-zinc-400">Resumen del uso real del sistema</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          <StatCard
            title="Total Registrados"
            value={stats.total}
            description="Usuarios totales en el sistema"
            icon="users"
            color="sky"
          />
          <StatCard
            title="Nuevos (7 días)"
            value={stats.newLast7Days}
            description="Registros en la última semana"
            icon="user-plus"
            color="emerald"
          />
          <StatCard
            title="Activos (7 días)"
            value={stats.activeLast7Days}
            description="Con login en la última semana"
            icon="activity"
            color="amber"
          />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Lista de Usuarios</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Ordenados por fecha de registro descendente ({users.length} total)
            </p>
          </div>
          <UserTable users={users} />
        </div>
      </main>
    </div>
  );
}