'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
} from 'recharts'

export function MetricChart({
  type = 'line',
  data,
  xKey = 'date',
  yKey = 'value',
  height = 260,
  color = 'var(--admin-lagoon)',
}: {
  type?: 'line' | 'area' | 'bar'
  data: Array<Record<string, any>>
  xKey?: string
  yKey?: string
  height?: number
  color?: string
}) {
  const Chart = type === 'area' ? AreaChart : type === 'bar' ? BarChart : LineChart
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <Chart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,58,68,0.10)" />
          <XAxis dataKey={xKey} tick={{ fill: 'var(--admin-ink-soft)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--admin-ink-soft)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'var(--admin-paper)', color: 'var(--admin-ink)', border: '1px solid var(--admin-line)', borderRadius: 10, boxShadow: '0 12px 30px rgba(18,58,68,0.12)' }} />
          {type === 'area' ? (
            <Area dataKey={yKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
          ) : type === 'bar' ? (
            <Bar dataKey={yKey} fill={color} radius={[8, 8, 0, 0]} />
          ) : (
            <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}

