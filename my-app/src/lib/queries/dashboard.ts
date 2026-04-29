import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Kpis = {
  revenueMtd: number;
  revenuePriorMonth: number;
  activeProjects: number;
  upcomingProjects: number;
  pendingPayments: number;
};

export type RevenuePoint = {
  month: string;
  income: number;
  expense: number;
};

export type StatusCount = {
  status: string;
  count: number;
};

export type UpcomingProject = {
  id: string;
  title: string;
  shoot_date: string;
  location: string | null;
  status: string | null;
  category: string | null;
  client_name: string | null;
};

export type RecentProject = {
  id: string;
  title: string;
  status: string;
  shoot_date: string | null;
  package_price: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  client_name: string | null;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfPrevMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = formatDate(startOfMonth(now));
  const priorMonthStart = formatDate(startOfPrevMonth(now));
  const sixMonthsAgo = formatDate(
    new Date(now.getFullYear(), now.getMonth() - 5, 1)
  );
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const activeStatuses = ['inquiry', 'booked', 'in_progress', 'editing'];

  const [
    currentMonthFinances,
    priorMonthFinances,
    activeProjectsRes,
    upcomingProjectsCountRes,
    pendingPaymentsRes,
    revenueSeriesRes,
    statusBreakdownRes,
    upcomingProjectsRes,
    recentProjectsRes,
  ] = await Promise.all([
    supabase
      .from('finances')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', monthStart),
    supabase
      .from('finances')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', priorMonthStart)
      .lt('date', monthStart),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', activeStatuses),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('shoot_date', 'is', null)
      .gte('shoot_date', now.toISOString())
      .lte('shoot_date', sevenDaysFromNow),
    supabase
      .from('projects')
      .select('package_price, amount_paid')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .neq('payment_status', 'paid'),
    supabase
      .from('finances')
      .select('amount, type, date')
      .eq('user_id', userId)
      .gte('date', sixMonthsAgo),
    supabase
      .from('projects')
      .select('status')
      .eq('user_id', userId),
    supabase
      .from('projects')
      .select('id, title, shoot_date, location, status, category, clients(full_name)')
      .eq('user_id', userId)
      .not('shoot_date', 'is', null)
      .gte('shoot_date', now.toISOString())
      .lte('shoot_date', sevenDaysFromNow)
      .order('shoot_date', { ascending: true })
      .limit(8),
    supabase
      .from('projects')
      .select(
        'id, title, status, shoot_date, package_price, amount_paid, payment_status, clients(full_name)'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const sumByType = (rows: Array<{ amount: number; type: string }> | null, type: string) =>
    (rows ?? []).filter((r) => r.type === type).reduce((acc, r) => acc + Number(r.amount), 0);

  const revenueMtd = sumByType(currentMonthFinances.data, 'income');
  const revenuePriorMonth = sumByType(priorMonthFinances.data, 'income');

  const pendingPayments = (pendingPaymentsRes.data ?? []).reduce((acc, row) => {
    const total = Number(row.package_price ?? 0);
    const paid = Number(row.amount_paid ?? 0);
    return acc + Math.max(0, total - paid);
  }, 0);

  const kpis: Kpis = {
    revenueMtd,
    revenuePriorMonth,
    activeProjects: activeProjectsRes.count ?? 0,
    upcomingProjects: upcomingProjectsCountRes.count ?? 0,
    pendingPayments,
  };

  // 6-month revenue series — bucket by YYYY-MM
  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, { income: 0, expense: 0 });
  }
  for (const row of revenueSeriesRes.data ?? []) {
    const key = row.date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (row.type === 'income') bucket.income += Number(row.amount);
    else if (row.type === 'expense') bucket.expense += Number(row.amount);
  }
  const revenueSeries: RevenuePoint[] = Array.from(buckets.entries()).map(
    ([month, { income, expense }]) => ({ month, income, expense })
  );

  // status breakdown — client-side aggregation since postgrest has no group-by
  const statusCounts = new Map<string, number>();
  for (const row of statusBreakdownRes.data ?? []) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }
  const projectStatus: StatusCount[] = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({ status, count })
  );

  const upcomingProjectsList: UpcomingProject[] = (upcomingProjectsRes.data ?? [])
    .filter((row): row is typeof row & { shoot_date: string } => !!row.shoot_date)
    .map((row) => {
      const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
      return {
        id: row.id,
        title: row.title,
        shoot_date: row.shoot_date,
        location: row.location,
        status: row.status,
        category: row.category,
        client_name: client?.full_name ?? null,
      };
    });

  const recentProjects: RecentProject[] = (recentProjectsRes.data ?? []).map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      shoot_date: row.shoot_date,
      package_price: row.package_price,
      amount_paid: row.amount_paid,
      payment_status: row.payment_status,
      client_name: client?.full_name ?? null,
    };
  });

  return {
    kpis,
    revenueSeries,
    projectStatus,
    upcomingProjects: upcomingProjectsList,
    recentProjects,
  };
}
