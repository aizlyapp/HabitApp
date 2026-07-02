'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/lib/supabase/admin-queries';

interface UserTableProps {
  users: AdminUser[];
}

export function UserTable({ users }: UserTableProps) {
  const sortedUsers = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800">
            <TableHead className="text-zinc-400">Email</TableHead>
            <TableHead className="text-zinc-400">Fecha de Registro</TableHead>
            <TableHead className="text-zinc-400">Último Login</TableHead>
            <TableHead className="text-zinc-400">Confirmado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user.id} className="border-zinc-800/50 hover:bg-zinc-800/30">
              <TableCell className="font-mono text-sm text-zinc-300">{user.email}</TableCell>
              <TableCell className="text-zinc-300">
                {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </TableCell>
              <TableCell className="text-zinc-400">
                {user.last_sign_in_at ? (
                  format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: es })
                ) : (
                  <span className="text-zinc-600 italic">Nunca</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.email_confirmed_at ? 'default' : 'outline'}
                  className={cn(
                    user.email_confirmed_at
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'border-rose-500/30 text-rose-400'
                  )}
                >
                  {user.email_confirmed_at ? 'Sí' : 'No'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {sortedUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}