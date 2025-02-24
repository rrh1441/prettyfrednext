"use client";

import React, { useState } from "react";
import EconomicChart from "@/components/EconomicChart";

/** A single data point shape (matching EconomicChart). */
interface DataPoint {
  date: string;
  value: number | null;
}

/** Truncate function: keep only newest 'limit' rows, assuming data is sorted ascending. */
function truncateNewest(
  data: DataPoint[],
  limit: number
): DataPoint[] {
  const len = data.length;
  if (len <= limit) return data;
  return data.slice(len - limit);
}

export default function StackedCharts() {
  // Example arrays (already sorted ascending):
  // We annotate them to avoid “implicit any” errors.
  const dailyData: DataPoint[] = [
    // e.g. { date: "2022-01-01", value: 1.23 },
    // ...
  ];

  const otherData: DataPoint[] = [
    // e.g. { date: "2022-01-01", value: 25000 },
    // ...
  ];

  // 1) TRUNCATE the daily data to newest 2,500 rows
  const truncatedDaily = truncateNewest(dailyData, 2500);

  // 2) Possibly also truncate otherData if needed
  const truncatedOther = truncateNewest(otherData, 2000);

  // 3) Toggle to show or hide second chart
  const [showSecondChart, setShowSecondChart] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Stacked Charts with Toggles & Local Sliders</h1>

      {/* CHART #1: DGS10 or similar daily data */}
      <div className="mb-8">
        <EconomicChart
          title="First Chart (Truncated Daily Series)"
          subtitle="Newest 2,500 daily points"
          data={truncatedDaily}
          color="#6E59A5"
          isEditable
        />
      </div>

      {/* Toggle second chart */}
      <div className="mb-4 flex items-center gap-2">
        <input
          id="toggleSecondChart"
          type="checkbox"
          checked={showSecondChart}
          onChange={(e) => setShowSecondChart(e.target.checked)}
        />
        <label htmlFor="toggleSecondChart" className="text-sm">
          Add Second Chart?
        </label>
      </div>

      {/* CHART #2 (Only if user toggles) */}
      {showSecondChart && (
        <div className="mb-8">
          <EconomicChart
            title="Second Chart (Another Dataset)"
            subtitle="Also truncated if desired"
            data={truncatedOther}
            color="#7E69AB"
            isEditable
          />
        </div>
      )}
    </div>
  );
}