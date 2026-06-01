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
  color = '#10b981',
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
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

