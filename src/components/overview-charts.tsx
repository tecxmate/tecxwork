"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminAnalytics } from "@/app/admin/admin-data";

const PURPLE = "#8C52FF";
const PURPLE_LIGHT = "#C4A6FF";
const GREEN = "#30D158";
const AMBER = "#FF9F0A";
const RED = "#FF453A";

function shortDate(d: string) {
  // "YYYY-MM-DD" -> "M/D"
  return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
}

const axisProps = {
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
  tickLine: false,
  axisLine: false,
} as const;

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--background)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
} as const;

export default function OverviewCharts({
  analytics,
}: {
  analytics: AdminAnalytics;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Registrations (cumulative)">
        <AreaChart data={analytics.registrations} margin={{ left: -18, top: 4, right: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            minTickGap={28}
            {...axisProps}
          />
          <YAxis allowDecimals={false} width={36} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="cumulativeStudents"
            name="Students"
            stroke={PURPLE}
            fill={PURPLE}
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="cumulativeRecruiters"
            name="Recruiters"
            stroke={PURPLE_LIGHT}
            fill={PURPLE_LIGHT}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Booking requests / day">
        <BarChart data={analytics.bookings} margin={{ left: -18, top: 4, right: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axisProps} />
          <YAxis allowDecimals={false} width={36} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="accepted" name="Accepted" stackId="b" fill={GREEN} radius={[0, 0, 0, 0]} />
          <Bar dataKey="inProgress" name="In progress" stackId="b" fill={AMBER} />
          <Bar dataKey="declined" name="Declined" stackId="b" fill={RED} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Emails sent / day">
        <BarChart data={analytics.emails} margin={{ left: -18, top: 4, right: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axisProps} />
          <YAxis allowDecimals={false} width={36} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="success" name="Sent" stackId="e" fill={PURPLE} />
          <Bar dataKey="failed" name="Failed" stackId="e" fill={RED} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Jobs posted (cumulative)">
        <AreaChart data={analytics.jobs} margin={{ left: -18, top: 4, right: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axisProps} />
          <YAxis allowDecimals={false} width={36} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey="cumulative"
            name="Jobs"
            stroke={PURPLE}
            fill={PURPLE}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartCard>
    </div>
  );
}
