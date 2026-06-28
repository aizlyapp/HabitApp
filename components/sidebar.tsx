'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  BedDouble,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
} from 'lucide-react';
import { loadConfigFromDB } from '@/lib/data/business-config-db';
import type { BusinessConfig } from '@/lib/data/business-config';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Panel Principal', icon: Home },
  { id: 'calendar', label: 'Reservas', icon: Calendar },
  { id: 'rooms', label: 'Habitaciones', icon: BedDouble },
  { id: 'guests', label: 'Huéspedes', icon: Users },
];

const bottomNavItems = [{ id: 'settings', label: 'Configuración', icon: Settings }];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessConfig, setBusinessConfig] = useState<Partial<BusinessConfig>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        loadConfigFromDB(user.id).then(setBusinessConfig);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-zinc-950 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              {businessConfig.logo ? (
                <>
                  <img
                    src={businessConfig.logo}
                    alt="logo"
                    className="h-8 w-auto max-h-8 object-contain rounded shrink-0"
                  />
                  <span className="text-lg font-semibold text-white truncate">
                    {businessConfig.nombre || 'Roomy'}
                  </span>
                </>
              ) : (
                <>
                  <BedDouble className="h-6 w-6 text-sky-400 shrink-0" />
                  <span className="text-lg font-semibold text-white">Roomy</span>
                </>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex hover:bg-zinc-800 active:scale-90 transition-transform duration-150"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform duration-300" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-zinc-400 transition-transform duration-300" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-400" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex h-[calc(100%-4rem)] flex-col justify-between p-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeView === item.id
                    ? 'bg-sky-600/20 text-sky-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeView === item.id
                    ? 'bg-sky-600/20 text-sky-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'text-zinc-500 hover:bg-rose-950/30 hover:text-rose-400 hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 lg:hidden bg-zinc-900 text-white shadow-lg"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </>
  );
}
