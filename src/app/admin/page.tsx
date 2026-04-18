'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp, Users, Zap, Calendar } from 'lucide-react'

interface Stats {
  revenue: { total: number; thisMonth: number; lastMonth: number }
  members: { total: number; active: number; newThisMonth: number }
  checkIns: { today: number }
  classes: { total: number; upcoming: number }
  revenueByDay: { date: string; revenue: number }[]
  membershipBreakdown: { tier: string; count: number }[]
  topClasses: { id: string; name: string; bookedCount: number; capacity: number; startTime: string }[]
}

const TIER_COLORS: Record<string, string> = {
  BASIC: '#9ca3af',
  PRO: '#16a34a',
  ELITE: '#7c3aed',
}

export default function AdminOverviewPage() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [token])

  const revenueChange =
    stats && stats.revenue.lastMonth > 0
      ? (((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth) * 100).toFixed(1)
      : null

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-4 space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          label="This Month"
          value={`$${stats.revenue.thisMonth.toFixed(0)}`}
          sub={revenueChange ? `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}% vs last month` : 'No prior data'}
          accent="green"
        />
        <StatCard
          icon={<Users size={18} className="text-blue-600" />}
          label="Active Members"
          value={String(stats.members.active)}
          sub={`+${stats.members.newThisMonth} this month`}
          accent="blue"
        />
        <StatCard
          icon={<Zap size={18} className="text-yellow-500" />}
          label="Check-ins Today"
          value={String(stats.checkIns.today)}
          sub={`${stats.members.total} total members`}
          accent="yellow"
        />
        <StatCard
          icon={<Calendar size={18} className="text-purple-600" />}
          label="Upcoming Classes"
          value={String(stats.classes.upcoming)}
          sub={`${stats.classes.total} total`}
          accent="purple"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Revenue — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stats.revenueByDay} barSize={28}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']}
              contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {stats.revenueByDay.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === stats.revenueByDay.length - 1 ? '#16a34a' : '#dcfce7'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Membership breakdown */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Active Memberships</h2>
        <div className="space-y-2">
          {stats.membershipBreakdown.length === 0 && (
            <p className="text-sm text-gray-400">No active memberships</p>
          )}
          {stats.membershipBreakdown.map((m) => {
            const total = stats.membershipBreakdown.reduce((s, x) => s + x.count, 0)
            const pct = total > 0 ? Math.round((m.count / total) * 100) : 0
            return (
              <div key={m.tier}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{m.tier}</span>
                  <span className="text-xs text-gray-500">
                    {m.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: TIER_COLORS[m.tier] ?? '#16a34a',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top classes */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Top Classes by Bookings</h2>
        <div className="space-y-2">
          {stats.topClasses.length === 0 && (
            <p className="text-sm text-gray-400">No classes yet</p>
          )}
          {stats.topClasses.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.bookedCount}/{c.capacity} booked
                </p>
              </div>
              <div className="w-16">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (c.bookedCount / c.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total revenue summary */}
      <div className="bg-green-600 rounded-2xl p-4 text-white">
        <p className="text-xs font-medium text-green-200">All-time Revenue</p>
        <p className="text-3xl font-black mt-0.5">${stats.revenue.total.toFixed(2)}</p>
        <p className="text-xs text-green-200 mt-1">
          Last month: ${stats.revenue.lastMonth.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: 'green' | 'blue' | 'yellow' | 'purple'
}) {
  const bg: Record<string, string> = {
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    purple: 'bg-purple-50',
  }
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className={`w-8 h-8 rounded-xl ${bg[accent]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
