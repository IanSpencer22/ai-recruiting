import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FunnelStep, OfferMetrics, SourceMetrics, TimeToFillByGroup } from '../types'

const COLORS = ['#0f766e', '#1d4e89', '#b45309', '#0e7490', '#be123c', '#7c3aed']

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #c9d6d0',
  borderRadius: 10,
  fontSize: 13,
}

export function TimeToFillChart({
  data,
}: {
  data: TimeToFillByGroup[]
}) {
  const chartData = data.slice(0, 8).map((d) => ({
    name: d.group.length > 18 ? `${d.group.slice(0, 16)}…` : d.group,
    fullName: d.group,
    avgDays: d.avgDays,
    medianDays: d.medianDays,
    hires: d.hires,
  }))

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d5e0db" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#5a6b64', fontSize: 12 }} unit="d" />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: '#14201c', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, key: string) => [
              `${value} days`,
              key === 'avgDays' ? 'Avg' : 'Median',
            ]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload?.fullName as string) ?? ''
            }
          />
          <Legend />
          <Bar dataKey="avgDays" name="Avg days" fill="#0f766e" radius={[0, 6, 6, 0]} />
          <Bar dataKey="medianDays" name="Median days" fill="#99f6e4" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OfferAcceptanceChart({ data }: { data: OfferMetrics[] }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d5e0db" vertical={false} />
          <XAxis dataKey="group" tick={{ fill: '#5a6b64', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis
            tick={{ fill: '#5a6b64', fontSize: 12 }}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => {
              if (name === 'acceptanceRate') return [`${value}%`, 'Accept rate']
              return [value, name]
            }}
          />
          <Bar dataKey="acceptanceRate" name="acceptanceRate" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList dataKey="acceptanceRate" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: '#5a6b64' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SourceEffectivenessChart({ data }: { data: SourceMetrics[] }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d5e0db" vertical={false} />
          <XAxis dataKey="source" tick={{ fill: '#5a6b64', fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fill: '#5a6b64', fontSize: 12 }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#5a6b64', fontSize: 12 }}
            unit="%"
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar yAxisId="left" dataKey="applicants" name="Applicants" fill="#99f6e4" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="left" dataKey="hires" name="Hires" fill="#0f766e" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="right" dataKey="hireRate" name="Hire rate %" fill="#b45309" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunnelDropoffChart({ data }: { data: FunnelStep[] }) {
  const funnelData = data.map((d, i) => ({
    ...d,
    name: d.stage,
    fill: COLORS[i % COLORS.length],
    value: d.count,
  }))

  return (
    <div className="chart-wrap tall">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, _n, item) => {
              const p = item?.payload as FunnelStep
              const drop =
                p.dropOffRate != null ? ` · ${p.dropOffRate}% drop-off` : ''
              return [`${value} candidates${drop}`, p.stage]
            }}
          />
          <Funnel dataKey="value" data={funnelData} isAnimationActive>
            <LabelList
              position="right"
              fill="#14201c"
              stroke="none"
              dataKey="name"
              style={{ fontSize: 12 }}
            />
            <LabelList
              position="center"
              fill="#fff"
              stroke="none"
              dataKey="value"
              style={{ fontSize: 12, fontWeight: 600 }}
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
