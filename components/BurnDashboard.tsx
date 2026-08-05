"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LatestTransaction = {
  hash: string;
  explorerUrl: string;
  timestamp?: number | string | null;
};

type TreasuryStats = {
  asset?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
  balanceRaw?: string;
  balanceFormatted?: string;
};

type StatsResponse = {
  configured: boolean;
  error?: string;
  chainId?: number | string;
  vaultAddress?: string;
  vaultExplorerUrl?: string;
  tokenAddress?: string;
  treasury?: TreasuryStats;
  totalInputSpentRaw?: string;
  totalInputSpentFormatted?: string;
  totalZazuBoughtRaw?: string;
  totalZazuBoughtFormatted?: string;
  totalExecutions?: number | string;
  lastExecutionTimestamp?: number | string | null;
  nextEligibleExecutionTimestamp?: number | string | null;
  minimumIntervalSeconds?: number | string;
  destination?: string;
  latestTransaction?: LatestTransaction | null;
  updatedAt?: string;
};

type BuybackItem = {
  executionId: string | number;
  inputAsset: string;
  inputSymbol?: string;
  amountInRaw: string;
  amountInFormatted?: string;
  zazuReceivedRaw: string;
  zazuReceivedFormatted?: string;
  tokenSymbol?: string;
  destination: string;
  timestamp: number | string;
  transactionHash: string;
  explorerUrl: string;
  blockNumber: string | number;
};

type BuybacksResponse = {
  configured: boolean;
  page: number;
  pageSize: number;
  items: BuybackItem[];
  nextPage: number | null;
};

type BurnDashboardProps = {
  configured: boolean;
  vaultAddress: string;
  explorerUrl: string;
};

const addressPattern = /^0x[a-fA-F0-9]{40}$/;

function shortAddress(value?: string) {
  if (!value || !addressPattern.test(value)) return value || "NOT SET";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function shortTransactionHash(value?: string) {
  if (!value || !/^0x[a-fA-F0-9]{64}$/.test(value)) {
    return value || "NOT SET";
  }
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function formatDecimal(value?: string, maximumFractionDigits = 4) {
  if (!value) return "0";
  const [integer = "0", decimal = ""] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = decimal.slice(0, maximumFractionDigits).replace(/0+$/, "");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

function formatDate(timestamp?: number | string | null) {
  if (!timestamp) return "NO EXECUTIONS YET";
  const numericTimestamp = Number(timestamp);
  if (!Number.isFinite(numericTimestamp) || numericTimestamp <= 0) {
    return "NO EXECUTIONS YET";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(numericTimestamp * 1000));
}

function countdownLabel(nextEligible?: number | string | null) {
  if (nextEligible === undefined || nextEligible === null) return "NOT STARTED";
  const numericTimestamp = Number(nextEligible);
  if (!Number.isFinite(numericTimestamp)) return "UNAVAILABLE";
  if (numericTimestamp <= 0) return "ELIGIBLE NOW";
  const remaining = numericTimestamp * 1000 - Date.now();
  if (remaining <= 0) return "ELIGIBLE NOW";
  const totalSeconds = Math.ceil(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function BurnDashboard({
  configured,
  vaultAddress,
  explorerUrl,
}: BurnDashboardProps) {
  const [stats, setStats] = useState<StatsResponse>({ configured: false });
  const [buybacks, setBuybacks] = useState<BuybackItem[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [clock, setClock] = useState("NOT CONFIGURED");
  const [loading, setLoading] = useState(configured);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadStats = useCallback(async () => {
    if (!configured) return;
    try {
      const response = await fetch("/api/stats");
      const payload = (await response.json()) as StatsResponse;
      setStats(payload);
    } catch {
      setStats((current) => ({
        ...current,
        error: "PUBLIC RPC UNAVAILABLE. RETAINING LAST VERIFIED READING.",
      }));
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const loadHistory = useCallback(
    async (page = 1, append = false) => {
      if (!configured) return;
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const response = await fetch(`/api/buybacks?page=${page}&pageSize=10`);
        const payload = (await response.json()) as BuybacksResponse;
        if (!response.ok) {
          throw new Error(
            (payload as BuybacksResponse & { error?: string }).error ||
              "Unable to read buyback history.",
          );
        }
        if (payload.configured) {
          setBuybacks((current) =>
            append ? [...current, ...payload.items] : payload.items,
          );
          setNextPage(payload.nextPage);
        } else {
          setBuybacks([]);
          setNextPage(null);
        }
      } catch {
        setHistoryError(
          "PUBLIC RPC UNAVAILABLE. RETAINING LAST VERIFIED LEDGER.",
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [configured],
  );

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadStats();
      void loadHistory();
    }, 0);
    const poll = window.setInterval(loadStats, 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(poll);
    };
  }, [loadHistory, loadStats]);

  useEffect(() => {
    const update = () => {
      if (!configured) setClock("NOT CONFIGURED");
      else if (loading) setClock("SYNCING");
      else setClock(countdownLabel(stats.nextEligibleExecutionTimestamp));
    };
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [configured, loading, stats.nextEligibleExecutionTimestamp]);

  const status = useMemo(() => {
    if (!configured) return "AWAITING VERIFIED VAULT";
    if (stats.error) return "VERIFICATION BLOCKED";
    if (loading) return "READING CHAIN";
    return stats.configured ? "ON-CHAIN DATA LIVE" : "CONFIGURATION INCOMPLETE";
  }, [configured, loading, stats.configured, stats.error]);

  const unavailableMetric = configured
    ? loading
      ? "SYNCING"
      : "UNAVAILABLE"
    : "NOT SET";
  const treasury = stats.configured
    ? formatDecimal(stats.treasury?.balanceFormatted)
    : unavailableMetric;
  const spent = stats.configured
    ? formatDecimal(stats.totalInputSpentFormatted)
    : unavailableMetric;
  const bought = stats.configured
    ? formatDecimal(stats.totalZazuBoughtFormatted, 2)
    : unavailableMetric;
  const executions = stats.configured
    ? String(stats.totalExecutions ?? "0")
    : unavailableMetric;

  return (
    <div className="burn-terminal">
      <div className="terminal-bar">
        <span className={stats.configured ? "terminal-live" : "terminal-waiting"}>
          <i /> {status}
        </span>
        <span>KEEPER CHECKS EVERY 60 SECONDS</span>
        <span>READ-ONLY PUBLIC DATA</span>
      </div>

      <div className="terminal-grid">
        <article className="metric metric-green">
          <span>NEXT BUYBACK</span>
          <strong>{clock}</strong>
          <small>Eligibility only. Unsafe executions are skipped.</small>
        </article>
        <article className="metric metric-gray">
          <span>TREASURY BALANCE</span>
          <strong>{treasury}</strong>
          <small>{stats.treasury?.symbol || "ASSET NOT CONFIGURED"}</small>
        </article>
        <article className="metric metric-blue">
          <span>TOTAL ZAZU BOUGHT</span>
          <strong>{bought}</strong>
          <small>Verified from vault accounting.</small>
        </article>
        <article className="metric metric-red">
          <span>TOTAL FEES DEPLOYED</span>
          <strong>{spent}</strong>
          <small>{stats.treasury?.symbol || "INPUT ASSET"}</small>
        </article>
      </div>

      <div className="terminal-detail-grid">
        <div><span>EXECUTIONS</span><strong>{executions}</strong></div>
        <div><span>LAST EXECUTION</span><strong>{formatDate(stats.lastExecutionTimestamp)}</strong></div>
        <div><span>INTERVAL</span><strong>{stats.minimumIntervalSeconds ? `${Number(stats.minimumIntervalSeconds) / 60} MIN ELIGIBILITY` : "15 MIN ELIGIBILITY"}</strong></div>
        <div><span>DESTINATION</span><strong>{shortAddress(stats.destination)}</strong></div>
      </div>

      <div className="proof-row">
        <div>
          <span>BUYBACK VAULT</span>
          <code>{shortAddress(stats.vaultAddress || vaultAddress)}</code>
        </div>
        <a href={stats.vaultExplorerUrl || explorerUrl} target="_blank" rel="noreferrer">OPEN EXPLORER ↗</a>
      </div>

      {stats.error ? <p className="terminal-error">{stats.error}</p> : null}

      <div className="history-head">
        <div><span>PUBLIC LEDGER</span><h3>BUYBACK HISTORY</h3></div>
        <p>Every row comes from a BuybackExecuted event. No event means no row.</p>
      </div>

      <div className="history-table" role="region" aria-label="Buyback history" tabIndex={0}>
        <div className="history-row history-labels" aria-hidden="true">
          <span>TIME</span><span>SPENT</span><span>ZAZU BOUGHT</span><span>DESTINATION</span><span>PROOF</span>
        </div>
        {buybacks.length ? buybacks.map((item) => (
          <div className="history-row" key={`${item.transactionHash}-${item.executionId}`}>
            <span>{formatDate(item.timestamp)}</span>
            <span>{formatDecimal(item.amountInFormatted || item.amountInRaw)} {item.inputSymbol || ""}</span>
            <span>{formatDecimal(item.zazuReceivedFormatted || item.zazuReceivedRaw, 2)} {item.tokenSymbol || "ZAZU"}</span>
            <span><code>{shortAddress(item.destination)}</code></span>
            <span><a href={item.explorerUrl} target="_blank" rel="noreferrer">TX ↗</a></span>
          </div>
        )) : (
          <div className="history-empty">
            <strong>{configured ? "NO VERIFIED BUYBACKS YET" : "VAULT NOT CONFIGURED"}</strong>
            <span>The ledger populates only after confirmed on-chain events.</span>
          </div>
        )}
      </div>

      {historyError ? <p className="terminal-error">{historyError}</p> : null}

      {nextPage ? (
        <button
          className="load-history"
          disabled={historyLoading}
          onClick={() => void loadHistory(nextPage, true)}
          type="button"
        >
          {historyLoading ? "READING CHAIN..." : "LOAD OLDER BUYBACKS"}
        </button>
      ) : null}

      {stats.latestTransaction ? (
        <a className="latest-proof" href={stats.latestTransaction.explorerUrl} target="_blank" rel="noreferrer">
          LATEST VERIFIED TX <code>{shortTransactionHash(stats.latestTransaction.hash)}</code> ↗
        </a>
      ) : null}
    </div>
  );
}
