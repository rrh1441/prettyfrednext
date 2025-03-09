"use client";

import Card from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

/** Minimal shape for your "economic_indicators" table. */
interface IndicatorRow {
  series_id: string;
  description: string;
}

/** Minimal shape for your "fred_data" table. */
interface FredRow {
  date: string;
  value: number | null;
}

/** A single data point for the chart. */
interface DataPoint {
  date: string;
  value: number | null;
}

/** Each line in Nivo's data array. */
interface NivoLineSeries {
  id: string; // The name/identifier
  color: string; // We store the line's color
  data: { x: string; y: number }[];
}

interface EconomicChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
  color?: string; // optional main color
  isEditable?: boolean;
}

/** Utility to split a dataset into segments whenever `value` is null. */
function createSegments(dataArray: DataPoint[]): DataPoint[][] {
  const segments: DataPoint[][] = [];
  let currentSegment: DataPoint[] = [];

  for (const pt of dataArray) {
    if (pt.value === null) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    } else {
      currentSegment.push(pt);
    }
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

export default function EconomicChart({
  title: initialTitle,
  subtitle,
  data: primaryData,
  color = "#6E59A5",
  isEditable = false,
}: EconomicChartProps) {
  // ---------- 1) Chart states for primary line ----------
  const defaultNonEditableColor = "#7E69AB";
  const chartColorDefault = isEditable ? color : defaultNonEditableColor;

  const [title, setTitle] = useState(initialTitle);
  const [chartColor, setChartColor] = useState(chartColorDefault);
  const [yMin, setYMin] = useState<string>("auto");
  const [yMax, setYMax] = useState<string>("auto");
  const [showPoints, setShowPoints] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local slider for the primary dataset
  const [dateRange, setDateRange] = useState<[number, number]>([0, primaryData.length]);
  const filteredPrimary = primaryData.slice(dateRange[0], dateRange[1]);

  // ---------- 2) Optional second series ----------
  const [showSecondSeries, setShowSecondSeries] = useState(false);
  const [secondSearch, setSecondSearch] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [fetchedSecondData, setFetchedSecondData] = useState<DataPoint[] | null>(null);

  async function handleSearchSecond() {
    setSearchError(null);
    setFetchedSecondData(null);

    const term = secondSearch.trim();
    if (!term) {
      setSearchError("Enter a series_id or description to search.");
      return;
    }

    try {
      // 1) find an economic_indicator
      const { data: rawIndicators, error: indErr } = await supabase
        .from("economic_indicators")
        .select("series_id, description")
        .or(`series_id.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(1);

      if (indErr) {
        setSearchError(indErr.message);
        return;
      }
      if (!rawIndicators || rawIndicators.length === 0) {
        setSearchError("No matching series found.");
        return;
      }

      const indicators = rawIndicators as IndicatorRow[];
      const found = indicators[0];
      const seriesId = found.series_id;

      // 2) fetch from fred_data
      const { data: rawRows, error: rowsErr } = await supabase
        .from("fred_data")
        .select("date, value")
        .eq("series_id", seriesId)
        .order("date", { ascending: true });

      if (rowsErr) {
        setSearchError(rowsErr.message);
        return;
      }
      if (!rawRows) {
        setSearchError("No rows returned for that series.");
        return;
      }

      const rows = rawRows as FredRow[];
      const dp: DataPoint[] = rows.map((r) => ({
        date: r.date,
        value: r.value,
      }));

      setFetchedSecondData(dp);
    } catch (err) {
      if (err instanceof Error) {
        setSearchError(err.message);
      } else {
        setSearchError("Unexpected error searching second series.");
      }
    }
  }

  let filteredSecond: DataPoint[] = [];
  if (showSecondSeries && fetchedSecondData) {
    const secondLen = fetchedSecondData.length;
    const maxIndex = Math.min(dateRange[1], secondLen);
    filteredSecond = fetchedSecondData.slice(dateRange[0], maxIndex);
  }

  // ---------- 3) Enough points check ----------
  const totalNonNullPrimary = filteredPrimary.filter((d) => d.value !== null).length;
  const totalNonNullSecondary = filteredSecond.filter((d) => d.value !== null).length;
  const hasEnoughPoints = totalNonNullPrimary >= 2 || totalNonNullSecondary >= 2;

  // ---------- 4) Build chart lines (Nivo data array) ----------
  // A) primary
  const primarySegments = createSegments(filteredPrimary);
  const primaryTransformed: NivoLineSeries[] = primarySegments.map((segment, idx) => ({
    id: idx === 0 ? title : `${title} (segment ${idx + 1})`,
    color: chartColor,
    data: segment.map((d) => ({
      x: d.date,
      y: d.value ?? 0,
    })),
  }));

  // B) second
  let secondaryTransformed: NivoLineSeries[] = [];
  if (showSecondSeries && filteredSecond.length > 0) {
    const seg2 = createSegments(filteredSecond);
    secondaryTransformed = seg2.map((segment, idx) => ({
      id: idx === 0 ? "Second Series" : `Second Series (seg ${idx + 1})`,
      color: "#EA5F5F",
      data: segment.map((d) => ({
        x: d.date,
        y: d.value ?? 0,
      })),
    }));
  }

  // Final array for `ResponsiveLine`
  const finalChartData: NivoLineSeries[] = [...primaryTransformed, ...secondaryTransformed];

  // ---------- 5) X-axis ticks ----------
  const biggerFiltered =
    filteredPrimary.length >= filteredSecond.length ? filteredPrimary : filteredSecond;
  const tickInterval = hasEnoughPoints ? Math.ceil(biggerFiltered.length / 12) : 1;
  const tickValues = biggerFiltered
    .map((d) => d.date)
    .filter((_, i) => i % tickInterval === 0);
  const lastDate = biggerFiltered[biggerFiltered.length - 1]?.date;
  if (lastDate && !tickValues.includes(lastDate)) {
    tickValues.push(lastDate);
  }

  // ---------- 6) Y-axis range ----------
  const computedYMin = yMin === "auto" ? "auto" : Number(yMin);
  const computedYMax = yMax === "auto" ? "auto" : Number(yMax);

  let areaBaselineValue: number | "auto" = 0;
  if (computedYMin === "auto") {
    const combinedValues = [...filteredPrimary, ...filteredSecond]
      .map((d) => d.value)
      .filter((v) => v != null) as number[];
    if (combinedValues.length > 0) {
      areaBaselineValue = Math.min(...combinedValues);
    }
  } else {
    areaBaselineValue = computedYMin;
  }

  // Here's the array of colors matching finalChartData order:
  const colorArray = finalChartData.map((line) => line.color);

  // ---------- Custom Y-Axis Formatter ----------
  // Only shrink numbers in the millions; leave smaller values unchanged.
  const formatYAxis = (val: number | string) => {
    const num = typeof val === "number" ? val : Number(val);
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  // ---------- Render ----------
  return (
    <Card style={{ backgroundColor: "#fff" }} className={cn("p-4", isEditable && "border-primary")}>
      {/* Title or editable Input */}
      {isEditable ? (
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold mb-2 border-none p-0 h-auto focus-visible:ring-0"
        />
      ) : (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}

      <p className="text-sm text-gray-600 mb-4">{subtitle}</p>

      {/* If editable: slider & advanced options */}
      {isEditable && (
        <>
          {/* Local Date Slider */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Date Range</label>
            <Slider.Root
              value={dateRange}
              onValueChange={(val) => setDateRange([val[0], val[1]] as [number, number])}
              min={0}
              max={Math.max(primaryData.length, fetchedSecondData?.length ?? 0)}
              step={1}
              className="relative flex w-full touch-none items-center"
            >
              <Slider.Track className="relative h-1 w-full grow rounded-full bg-gray-300">
                <Slider.Range className="absolute h-full rounded-full bg-primary" />
              </Slider.Track>
              <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-white" />
              <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-white" />
            </Slider.Root>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{filteredPrimary[0]?.date ?? ""}</span>
              <span>{biggerFiltered[biggerFiltered.length - 1]?.date ?? ""}</span>
            </div>
          </div>

          {/* Toggle advanced */}
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="mb-4 underline text-sm text-gray-800 hover:text-gray-900"
          >
            {showAdvanced ? "Hide Customize Chart" : "Customize Chart"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 mb-4 border border-gray-100 p-3 rounded">
              {/* Primary Color */}
              <div className="flex items-center gap-2">
                <label className="text-sm w-20">Primary Color:</label>
                <input
                  type="color"
                  value={chartColor}
                  onChange={(e) => setChartColor(e.target.value)}
                  className="w-12 h-8 border p-0"
                />
              </div>

              {/* Y-axis Range */}
              <div className="flex items-center gap-2">
                <label className="text-sm w-20">Y Range:</label>
                <Input
                  type="text"
                  placeholder="Min or auto"
                  value={yMin}
                  onChange={(e) => setYMin(e.target.value)}
                  className="w-24"
                />
                <Input
                  type="text"
                  placeholder="Max or auto"
                  value={yMax}
                  onChange={(e) => setYMax(e.target.value)}
                  className="w-24"
                />
              </div>

              {/* Show Points */}
              <div className="flex items-center gap-2">
                <Switch checked={showPoints} onCheckedChange={setShowPoints} id="showPoints" />
                <label htmlFor="showPoints" className="text-sm">
                  Show Points
                </label>
              </div>

              {/* Toggle Second Series */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={showSecondSeries}
                  onCheckedChange={setShowSecondSeries}
                  id="showSecondSeries"
                />
                <label htmlFor="showSecondSeries" className="text-sm">
                  Add second series
                </label>
              </div>

              {showSecondSeries && (
                <div className="border border-gray-200 p-3 rounded mt-2 space-y-2">
                  <label className="block text-sm font-medium">
                    Search second series (by series_id or desc)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g. DGS5"
                      value={secondSearch}
                      onChange={(e) => setSecondSearch(e.target.value)}
                    />
                    <button
                      onClick={handleSearchSecond}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Search
                    </button>
                  </div>
                  {searchError && (
                    <p className="text-red-500 text-sm">{searchError}</p>
                  )}
                  {fetchedSecondData !== null && (
                    <p className="text-xs text-green-700">
                      Second dataset loaded! Rows: {fetchedSecondData.length}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Main chart area */}
      <div className="h-[350px] w-full bg-white">
        {!hasEnoughPoints ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Not enough data to display a chart.
          </div>
        ) : (
          <ResponsiveLine
            data={finalChartData}
            colors={colorArray}
            margin={{ top: 40, right: 30, bottom: 60, left: 70 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: computedYMin,
              max: computedYMax,
              stacked: false,
            }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 15, // increased padding
              tickRotation: -30,
              tickValues,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              format: formatYAxis,
            }}
            curve="linear"
            useMesh
            enableSlices={false}
            enableArea
            areaOpacity={0.1}
            areaBaselineValue={areaBaselineValue}
            enablePoints={showPoints}
            pointSize={6}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            theme={{
              background: "#fff",
              axis: {
                ticks: {
                  text: { fill: "#666" },
                },
                legend: {
                  text: { fill: "#666" },
                },
              },
              grid: {
                line: {
                  stroke: "#fff",
                  strokeWidth: 0,
                },
              },
            }}
          />
        )}
      </div>

      {/* Bottom text row: left  "Visualization by PrettyFRED", right "Source: FRED" */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>Visualization by PrettyFRED</span>
        <span>Source: Federal Reserve Economic Data (FRED)</span>
      </div>
    </Card>
  );
}