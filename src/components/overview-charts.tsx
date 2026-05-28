"use client";

import { useEffect, useState } from "react";
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

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

function CapacityChart({
  data,
}: {
  data: AdminAnalytics["capacity"];
}) {
  const rows = data.map((d) => ({
    company: d.company,
    booked: d.booked,
    remaining: Math.max(0, d.total - d.booked),
    total: d.total,
    accepted: d.accepted,
    unconfirmed: d.unconfirmed,
    rejected: d.rejected,
  }));
  const isMobile = useIsMobile();
  const labelWidth = isMobile ? 96 : 200;
  const totalSlots = rows.reduce((s, r) => s + r.total, 0);
  const totalBooked = rows.reduce((s, r) => s + r.booked, 0);
  const fillRate = totalSlots ? Math.round((totalBooked / totalSlots) * 100) : 0;
  // Two bars per company (slots + requests) → ~46px per row.
  const innerHeight = Math.max(240, rows.length * 46 + 56);

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Slot capacity vs booking requests by company
        </p>
        <p className="text-xs text-muted-foreground">
          {totalBooked}/{totalSlots} slots booked ({fillRate}%)
        </p>
      </div>
      <p className="mb-2 text-[11px] leading-tight text-muted-foreground/80">
        Top bar = interview slots (booked + available). Bottom bar = booking
        requests (accepted + unconfirmed + rejected). The two measure different
        things, so they don&apos;t add up.
      </p>
      <div className="max-h-[560px] w-full overflow-y-auto">
        <div style={{ height: innerHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={rows}
              margin={{ left: 8, top: 4, right: 14, bottom: 0 }}
              barCategoryGap="22%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis
                type="category"
                dataKey="company"
                width={labelWidth}
                interval={0}
                tick={{ fontSize: isMobile ? 10 : 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip {...tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              {/* Supply: interview slots */}
              <Bar dataKey="booked" name="Booked (slot)" stackId="cap" fill={PURPLE} radius={[2, 0, 0, 2]} />
              <Bar dataKey="remaining" name="Available (slot)" stackId="cap" fill={PURPLE_LIGHT} radius={[0, 2, 2, 0]} />
              {/* Demand: booking requests */}
              <Bar dataKey="accepted" name="Accepted" stackId="req" fill={GREEN} radius={[2, 0, 0, 2]} />
              <Bar dataKey="unconfirmed" name="Unconfirmed" stackId="req" fill={AMBER} />
              <Bar dataKey="rejected" name="Rejected" stackId="req" fill={RED} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Registrations (cumulative)">
        <AreaChart data={analytics.registrations} margin={{ left: 4, top: 4, right: 14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            minTickGap={28}
            {...axisProps}
          />
          <YAxis allowDecimals={false} width={40} {...axisProps} />
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
        <BarChart data={analytics.bookings} margin={{ left: 4, top: 4, right: 14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axisProps} />
          <YAxis allowDecimals={false} width={40} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="accepted" name="Accepted" stackId="b" fill={GREEN} radius={[0, 0, 0, 0]} />
          <Bar dataKey="inProgress" name="In progress" stackId="b" fill={AMBER} />
          <Bar dataKey="declined" name="Declined" stackId="b" fill={RED} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Emails sent / day">
        <BarChart data={analytics.emails} margin={{ left: 4, top: 4, right: 14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axisProps} />
          <YAxis allowDecimals={false} width={40} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="success" name="Sent" stackId="e" fill={PURPLE} />
          <Bar dataKey="failed" name="Failed" stackId="e" fill={RED} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Jobs posted (cumulative)">
        <AreaChart data={analytics.jobs} margin={{ left: 4, top: 4, right: 14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} {...axisProps} />
          <YAxis allowDecimals={false} width={40} {...axisProps} />
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

      {analytics.capacity.length > 0 ? (
        <CapacityChart data={analytics.capacity} />
      ) : null}
    </div>
  );
}
