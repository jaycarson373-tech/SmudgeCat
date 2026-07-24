"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CampaignProgressProps = {
  raisedUsd: number;
  goalUsd: number;
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function CampaignProgress({
  raisedUsd,
  goalUsd,
}: CampaignProgressProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const safeRaised = Number.isFinite(raisedUsd) ? Math.max(0, raisedUsd) : 0;
  const safeGoal = Number.isFinite(goalUsd) && goalUsd > 0 ? goalUsd : 10000;
  const percentage = useMemo(
    () => Math.min(100, (safeRaised / safeGoal) * 100),
    [safeGoal, safeRaised],
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="goal-meter" ref={rootRef}>
      <div className="goal-figures">
        <div>
          <span>Raised</span>
          <strong>{usd.format(safeRaised)}</strong>
        </div>
        <div>
          <span>Goal</span>
          <strong>{usd.format(safeGoal)}</strong>
        </div>
        <div>
          <span>Complete</span>
          <strong>{Math.round(percentage)}%</strong>
        </div>
      </div>

      <div
        className="thermometer"
        role="progressbar"
        aria-label="Tutu donation goal"
        aria-valuemin={0}
        aria-valuemax={safeGoal}
        aria-valuenow={safeRaised}
      >
        <div
          className="thermometer-fill"
          style={{ width: visible ? `${percentage}%` : "0%" }}
        />
        <div className="milestone milestone-quarter">
          <i />
          <span>$2.5K</span>
          <b>Vet fund</b>
        </div>
        <div className="milestone milestone-half">
          <i />
          <span>$5K</span>
          <b>Halfway for the Dino</b>
        </div>
        <div className="milestone milestone-full">
          <i />
          <span>$10K</span>
          <b>Full send to Tutu</b>
        </div>
      </div>
    </div>
  );
}
