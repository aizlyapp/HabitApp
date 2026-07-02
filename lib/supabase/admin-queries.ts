import { createAdminClient } from './admin';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null | undefined;
  email_confirmed_at: string | null | undefined;
}

export interface UserStats {
  total: number;
  newLast7Days: number;
  activeLast7Days: number;
}

function isWithinLast7Days(dateString: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return date >= sevenDaysAgo;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient();
  const allUsers: AdminUser[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));

    allUsers.push(...users);

    if (users.length < perPage) {
      break;
    }

    page++;
  }

  return allUsers;
}

export async function getUserStats(): Promise<UserStats> {
  const users = await getAllUsers();
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let total = 0;
  let newLast7Days = 0;
  let activeLast7Days = 0;

  for (const user of users) {
    total++;

    const createdAt = new Date(user.created_at);
    if (createdAt >= sevenDaysAgo) {
      newLast7Days++;
    }

    if (user.last_sign_in_at) {
      const lastSignIn = new Date(user.last_sign_in_at);
      if (lastSignIn >= sevenDaysAgo) {
        activeLast7Days++;
      }
    }
  }

  return {
    total,
    newLast7Days,
    activeLast7Days,
  };
}