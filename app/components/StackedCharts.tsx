"use client";

import React, { useState } from "react";
import EconomicChart from "@/components/EconomicChart";

/** Truncate function: keep only newest 'limit' rows, assuming data is sorted ascending. */
function truncateNewest(
  data: { date: string; value: number | null }[],
  limit: number
) {
  const len = data.length;
  if (len <= limit) return data;
  return data.slice(len - limit);
}

export default function StackedCharts() {
  // Example arrays (already sorted ascending).
  // Typically you'd fetch them from your DB or pass them in via props.

  const dailyData = [
    // Potentially tens of thousands of daily points from 1962 to present
    // Example: { date: "2020-01-01", value: 1.55 }, ...
  ];

  const otherData = [
    // Another series: weekly, monthly, quarterly, or daily
    // Example: { date: "2020-01-01", value: 2000 }, ...
  ];

  // 1) TRUNCATE the daily data to newest 2,500 rows
  const truncatedDaily = truncateNewest(dailyData, 2500);

  // 2) The other dataset might or might not be truncated. 
  // If you also want to limit it, do similarly:
  const truncatedOther = truncateNewest(otherData, 2000);

  // 3) Toggle to show or hide second chart
  const [showSecondChart, setShowSecondChart] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Stacked Charts with Toggles & Local Sliders</h1>

      {/* CHART #1: DGS10 or whatever daily data */}
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