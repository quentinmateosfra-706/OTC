import React, { useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  Mountain, TrendingUp, Trophy, Calendar, GitCompare, BarChart3,
  ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_MS = 86400000;

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfQuarter(d) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); }
function startOfSemester(d) { return new Date(d.getFullYear(), d.getMonth() < 6 ? 0 : 6, 1); }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }
function parseInput(s) { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd); }

function buildBuckets(start, end, unit) {
  const buckets = [];
  let cur;
  if (unit === "month") cur = new Date(start.getFullYear(), start.getMonth(), 1);
  else if (unit === "week") { cur = new Date(start); cur.setDate(cur.getDate() - cur.getDay()); }
  else cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  while (cur <= end) {
    let next, label;
    if (unit === "month") {
      next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      label = cur.toLocaleDateString("fr-FR", { month: "short" });
    } else if (unit === "week") {
      next = new Date(cur);
      next.setDate(next.getDate() + 7);
      label = cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    } else {
      next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      label = cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    }
    buckets.push({ start: new Date(cur), end: next, label });
    cur = next;
  }
  return buckets;
}

function sumBucket(attempts, bucket, metric) {
  let val = 0;
  for (const a of attempts) {
    const d = new Date(a.activity_date);
    if (d >= bucket.start && d < bucket.end) {
      val += metric === "count" ? 1 : (a[metric] || 0);
    }
  }
  return val;
}

function totalForPeriod(attempts, start, end) {
  let distance = 0, dplus = 0, count = 0;
  for (const a of attempts) {
    const d = new Date(a.activity_date);
    if (d >= start && d <= end) {
      distance += a.distance_km || 0;
      dplus += a.elevation_gain_m || 0;
      count += 1;
    }
  }
  return { distance, dplus, count };
}

function fmtNum(n, unit) {
  if (unit === "km") return `${Math.round(n)} km`;
  if (unit === "m") return `${Math.round(n).toLocaleString("fr-FR")} m`;
  return `${Math.round(n)}`;
}

const SHORTCUTS = [
  { key: "month", label: "Mois", range: () => [startOfMonth(new Date()), new Date()] },
  { key: "quarter", label: "Trimestre", range: () => [startOfQuarter(new Date()), new Date()] },
  { key: "semester", label: "Semestre", range: () => [startOfSemester(new Date()), new Date()] },
  { key: "year", label: "Année", range: () => [startOfYear(new Date()), new Date()] }
];

const COMPARE_OPTS = [
  { key: "none", label: "Aucune" },
  { key: "previous", label: "Période préc." },
  { key: "year", label: "Année préc." }
];

const METRICS = [
  { key: "distance_km", label: "Distance", unit: "km", icon: Mountain },
  { key: "elevation_gain_m", label: "D+", unit: "m", icon: TrendingUp },
  { key: "count", label: "Défis", unit: "", icon: Trophy }
];

function Delta({ current, previous, unit }) {
  if (previous === 0 && current === 0)
    return <span className="text-[#aab5c3] flex items-center gap-0.5 text-[10px]"><Minus className="w-3 h-3" /></span>;
  if (previous === 0)
    return <span className="text-emerald-400 flex items-center gap-0.5 text-[10px]"><ArrowUp className="w-3 h-3" />{fmtNum(current, unit)}</span>;
  const pct = ((current - previous) / previous) * 100;
  if (Math.round(pct) === 0)
    return <span className="text-[#aab5c3] flex items-center gap-0.5 text-[10px]"><Minus className="w-3 h-3" />0%</span>;
  const up = pct > 0;
  return (
    <span className={`${up ? "text-emerald-400" : "text-orange-400"} flex items-center gap-0.5 text-[10px]`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(Math.round(pct))}%
    </span>
  );
}

function ChartTooltip({ active, payload, label, metric }) {
  if (!active || !payload || !payload.length) return null;
  const m = METRICS.find((x) => x.key === metric);
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.dataKey === "current" ? "Période" : "Comparaison"}</span>
          <span className="font-semibold ml-auto">{fmtNum(p.value, m?.unit || "")}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsDashboard({ attempts }) {
  const [shortcut, setShortcut] = useState("year");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [compare, setCompare] = useState("none");
  const [metric, setMetric] = useState("distance_km");

  const validated = useMemo(
    () => attempts.filter((a) => a.status === "validated" && a.activity_date),
    [attempts]
  );

  const { chartData, totals, compareTotals, periodLabel, compareLabel, hasCompareData } = useMemo(() => {
    let start, end;
    if (shortcut === "custom") {
      start = customStart ? parseInput(customStart) : startOfYear(new Date());
      end = customEnd ? parseInput(customEnd) : new Date();
      if (end < start) [start, end] = [end, start];
    } else {
      const sc = SHORTCUTS.find((s) => s.key === shortcut);
      [start, end] = sc ? sc.range() : [startOfYear(new Date()), new Date()];
    }
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

    const days = Math.ceil((end - start) / DAY_MS);
    const u = days > 120 ? "month" : days > 45 ? "week" : "day";

    const curBuckets = buildBuckets(start, end, u);

    let prevStart = null, prevEnd = null;
    if (compare === "previous") {
      const dur = end - start;
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - dur);
    } else if (compare === "year") {
      prevStart = new Date(start.getFullYear() - 1, start.getMonth(), start.getDate());
      prevEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate(), 23, 59, 59);
    }

    const prevBuckets = prevStart && prevEnd ? buildBuckets(prevStart, prevEnd, u) : [];
    const maxLen = Math.max(curBuckets.length, prevBuckets.length);
    const data = [];
    for (let i = 0; i < maxLen; i++) {
      const cb = curBuckets[i];
      const pb = prevBuckets[i];
      data.push({
        label: cb ? cb.label : (pb ? pb.label : ""),
        current: cb ? sumBucket(validated, cb, metric) : 0,
        compare: pb ? sumBucket(validated, pb, metric) : 0,
      });
    }

    const t = totalForPeriod(validated, start, end);
    const ct = prevStart && prevEnd ? totalForPeriod(validated, prevStart, prevEnd) : null;
    const pLabel = `${start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`;
    const cLabel = ct
      ? `${prevStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – ${prevEnd.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`
      : "";

    return { chartData: data, totals: t, compareTotals: ct, periodLabel: pLabel, compareLabel: cLabel, hasCompareData: ct !== null };
  }, [shortcut, customStart, customEnd, compare, metric, validated]);

  const cards = [
    { ...METRICS[0], value: totals.distance, compareValue: compareTotals?.distance },
    { ...METRICS[1], value: totals.dplus, compareValue: compareTotals?.dplus },
    { ...METRICS[2], value: totals.count, compareValue: compareTotals?.count },
  ];

  return (
    <section className="rounded-[18px] border border-[#354152] bg-[#202a38] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-[17px] h-[17px] text-primary" />
        <h3 className="font-bold text-[15px]">Tableau de bord</h3>
        <span className="ml-auto text-[11px] text-[#aab5c3]">{periodLabel}</span>
      </div>

      {/* Period shortcuts */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {SHORTCUTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setShortcut(s.key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              shortcut === s.key ? "border-primary bg-primary/15 text-primary" : "border-[#3d4858] text-[#aab5c3] hover:text-white"
            )}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setShortcut("custom")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-colors",
            shortcut === "custom" ? "border-primary bg-primary/15 text-primary" : "border-[#3d4858] text-[#aab5c3] hover:text-white"
          )}
        >
          Personnalisé
        </button>
      </div>

      {/* Custom date inputs */}
      {shortcut === "custom" && (
        <div className="flex items-center gap-3 mb-4 animate-fade-up">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#aab5c3]" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[#171f2b] border border-[#3d4858] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <span className="text-[#aab5c3] text-xs">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-[#171f2b] border border-[#3d4858] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
          />
        </div>
      )}

      {/* Comparison selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <GitCompare className="w-3.5 h-3.5 text-[#aab5c3] shrink-0" />
        {COMPARE_OPTS.map((o) => (
          <button
            key={o.key}
            onClick={() => setCompare(o.key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              compare === o.key ? "border-primary bg-primary/15 text-primary" : "border-[#3d4858] text-[#aab5c3] hover:text-white"
            )}
          >
            {o.label}
          </button>
        ))}
        {hasCompareData && <span className="text-[10px] text-[#aab5c3] ml-1">{compareLabel}</span>}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map((c) => (
          <div key={c.key} className="rounded-xl border border-[#3d4858] bg-[#171f2b] px-3 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <c.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-[#aab5c3]">{c.label}</span>
            </div>
            <div className="font-bold text-lg tabular-nums">{fmtNum(c.value, c.unit)}</div>
            {hasCompareData && c.compareValue != null && (
              <div className="mt-0.5">
                <Delta current={c.value} previous={c.compareValue} unit={c.unit} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Metric selector */}
      <div className="flex items-center gap-2 mb-3">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5",
              metric === m.key ? "border-primary bg-primary/15 text-primary" : "border-[#3d4858] text-[#aab5c3] hover:text-white"
            )}
          >
            <m.icon className="w-3.5 h-3.5" /> {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[220px] w-full">
        {validated.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#aab5c3] text-center px-4">
            Pas encore de tentative validée. Cours un premier défi pour voir tes stats.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gCur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f2c450" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f2c450" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCmp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b6b7e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5b6b7e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a313c" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#929caa" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#929caa" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<ChartTooltip metric={metric} />} />
              {compare !== "none" && (
                <Area type="monotone" dataKey="compare" stroke="#5b6b7e" strokeWidth={1.5} fill="url(#gCmp)" strokeDasharray="4 4" name="Comparaison" connectNulls />
              )}
              <Area type="monotone" dataKey="current" stroke="#f2c450" strokeWidth={2} fill="url(#gCur)" name="Période" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {hasCompareData && compareTotals && compareTotals.count === 0 && (
        <p className="mt-3 text-[11px] text-[#aab5c3]">
          Pas de tentative sur la période de comparaison. Les courbes de comparaison apparaîtront quand tu auras suffisamment d'historique.
        </p>
      )}
    </section>
  );
}