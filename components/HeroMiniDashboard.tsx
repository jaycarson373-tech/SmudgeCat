"use client";

import { useEffect, useState } from "react";

type StatsResponse = {
  treasury?: {
    symbol?: string;
    balanceFormatted?: string;
  } | null;
  totalInputSpentFormatted?: string | null;
  totalZazuBoughtFormatted?: string | null;
  totalZazuBurnedFormatted?: string | null;
  totalExecutions?: number | string | null;
};

const ZERO_STATS: StatsResponse = {
  treasury: { balanceFormatted: "0" },
  totalInputSpentFormatted: "0",
  totalZazuBoughtFormatted: "0",
  totalZazuBurnedFormatted: "0",
  totalExecutions: 0,
};

function formatDecimal(value: string | null | undefined, digits = 2) {
  const candidate = String(value ?? "0").trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(candidate)) return "0";

  const negative = candidate.startsWith("-");
  const unsigned = negative ? candidate.slice(1) : candidate;
  const [integer = "0", decimal = ""] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = decimal.slice(0, digits).replace(/0+$/, "");

  return `${negative ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`;
}

export function HeroMiniDashboard() {
  const [stats, setStats] = useState<StatsResponse>(ZERO_STATS);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) return;
        const nextStats = (await response.json()) as StatsResponse;
        if (active) setStats(nextStats);
      } catch {
        // Keep the clean zero state when a public RPC read is unavailable.
      }
    }

    void loadStats();
    const poll = window.setInterval(loadStats, 30_000);

    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, []);

  const asset = stats.treasury?.symbol || "WETH";

  return (
    <aside className="hero-mini-dashboard" id="stats" aria-label="Zazu buyback dashboard">
      <div className="mini-dashboard-title">
        <span><i aria-hidden="true" /> BUYBACK DASHBOARD</span>
        <small>POWERED BY PONS</small>
      </div>
      <div className="mini-dashboard-grid" aria-live="polite">
        <div>
          <span>ZAZU BURNED</span>
          <strong>{`${formatDecimal(stats.totalZazuBurnedFormatted)} $ZAZU`}</strong>
        </div>
        <div>
          <span>ZAZU BOUGHT</span>
          <strong>{`${formatDecimal(stats.totalZazuBoughtFormatted)} $ZAZU`}</strong>
        </div>
        <div>
          <span>FEES DEPLOYED</span>
          <strong>{`${formatDecimal(stats.totalInputSpentFormatted)} ${asset}`}</strong>
        </div>
        <div>
          <span>BUYBACKS</span>
          <strong>{formatDecimal(String(stats.totalExecutions ?? 0), 0)}</strong>
        </div>
      </div>
    </aside>
  );
}
