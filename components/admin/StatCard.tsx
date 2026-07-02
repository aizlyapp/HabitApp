'use client';

import { Users, UserPlus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: 'users' | 'user-plus' | 'activity';
  color: 'sky' | 'emerald' | 'amber';
}

const icons = {
  users: Users,
  'user-plus': UserPlus,
  activity: Activity,
};

const colorClasses = {
  sky: {
    bg: 'bg-sky-500/20',
    border: 'border-sky-500/30',
    icon: 'text-sky-400',
    value: 'text-sky-300',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    value: 'text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    value: 'text-amber-300',
  },
};

export function StatCard({ title, value, description, icon, color }: StatCardProps) {
  const Icon = icons[icon];
  const colors = colorClasses[color];

  return (
    <div className={cn('rounded-lg p-5 transition-all duration-200 hover:scale-[1.02]', colors.bg, colors.border, 'border')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white {colors.value}">{value.toLocaleString('es-AR')}</p>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        <div className={cn('p-3 rounded-lg shrink-0', colors.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}