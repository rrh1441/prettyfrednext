"use client";

import Card from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

/** A single data point */
interface DataPoint {
  date: string;
  value: number | null;
}

interface EconomicChartProps {
  title: string;
  subtitle: string;
  /** Primary dataset. */
  data: DataPoint[];
  color?: string;
  isEditable?: boolean;
}

/**
 * Splits a dataset into "segments" for null-gap logic.
 */
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
  data,
  color = "#6E59A5",
  isEditable = false,
}: EconomicChartProps) {
  // -- Primary data
  const validData = data;

  // If chart is not editable, override color
  const defaultNonEditableColor = "#7E69AB";
  const chartColorDefault = isEditable ? color : defaultNonEditableColor;

  // --- States for advanced options
  const [title, setTitle] = useState(initialTitle);
  const [chartColor, setChartColor] = useState(chartColorDefault);
  const [yMin, setYMin] = useState<string>("auto");
  const [yMax, setYMax] = useState<string>("auto");
  const [showPoints, setShowPoints] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local slider range
  const [dateRange, setDateRange] = useState<[number, number]>([0, validData.length]);
  const filteredPrimary = validData.slice(dateRange[0], dateRange[1]);

  // We'll let the user always see a "Add Second Series" toggle
  // plus a search field to find that second series.

  // 1) If user toggles it on => we show search input and, if a dataset is loaded, we draw it
  const [showSecondSeries, setShowSecondSeries] = useState(false);

  // 2) Searching states
  const [secondSearch, setSecondSearch] = useState("");
  const [fetchedSecondData, setFetchedSecondData] = useState<DataPoint[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearchSecond() {
    setSearchError(null);
    setFetchedSecondData(null);

    const term = secondSearch.trim();
    if (!term) {
      setSearchError("Enter a series_id or part of description to search.");
      return;
    }

    try {
      // We'll do a quick supabase query:
      // 1) Find an economic_indicator with series_id or description ILIKE
      // 2) Then fetch from fred_data all rows for the first match
      // This is a simplistic approach; adjust as needed for your real logic.
      const { data: indicators, error: indErr } = await supabase
        .from("economic_indicators")
        .select("series_id, description")
        .or(`series_id.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(1);

      if (indErr) {
        setSearchError(indErr.message);
        return;
      }
      if (!indicators || indicators.length === 0) {
        setSearchError("No matching series found.");
        return;
      }

      const found = indicators[0];
      const seriesId = found.series_id;

      // Now fetch from fred_data
      const { data: rows, error: rowsErr } = await supabase
        .from("fred_data")
        .select("date, value")
        .eq("series_id", seriesId)
        .order("date", { ascending: true });

      if (rowsErr) {
        setSearchError(rowsErr.message);
        return;
      }
      if (!rows) {
        setSearchError("No rows returned.");
        return;
      }

      // Convert rows to DataPoint
      const dp: DataPoint[] = rows.map((r) => ({
        date: r.date,
        value: r.value,
      }));
      setFetchedSecondData(dp);
    } catch (err: any) {
      setSearchError(err.message || "Unexpected error searching second series.");
    }
  }

  // 3) If user has toggled second series + we have a fetched dataset => slice it
  let filteredSecond: DataPoint[] = [];
  if (showSecondSeries && fetchedSecondData) {
    const secondLen = fetchedSecondData.length;
    // If the slider's max is bigger than the second dataset's length, we clamp
    const maxIndex = Math.min(dateRange[1], secondLen);
    filteredSecond = fetchedSecondData.slice(dateRange[0], maxIndex);
  }

  // Check if either dataset has enough points
  const totalNonNullPrimary = filteredPrimary.filter((d) => d.value !== null).length;
  const totalNonNullSecondary = filteredSecond.filter((d) => d.value !== null).length;
  const hasEnoughPoints = totalNonNullPrimary >= 2 || totalNonNullSecondary >= 2;

  // Build chart lines
  // A) Primary lines
  const primarySegments = createSegments(filteredPrimary);
  const primaryTransformed = primarySegments.map((segment, idx) => ({
    id: idx === 0 ? title : `${title} (seg ${idx + 1})`,
    color: chartColor,
    data: segment.map((d) => ({ x: d.date, y: d.value ?? 0 })),
  }));

  // B) Second lines if toggled
  let secondaryTransformed: any[] = [];
  if (showSecondSeries && filteredSecond.length > 0) {
    const seg2 = createSegments(filteredSecond);
    secondaryTransformed = seg2.map((segment, idx) => ({
      id: idx === 0 ? "Second Series" : `Second Series (seg ${idx + 1})`,
      color: "#EA5F5F",
      data: segment.map((d) => ({ x: d.date, y: d.value ?? 0 })),
    }));
  }

  // Merge them
  const finalChartData = [...primaryTransformed, ...secondaryTransformed];

  // X-axis ticks => we pick whichever filtered array is bigger
  const biggerFiltered = filteredPrimary.length >= filteredSecond.length ? filteredPrimary : filteredSecond;
  const tickInterval = hasEnoughPoints ? Math.ceil(biggerFiltered.length / 12) : 1;
  const tickValues = biggerFiltered
    .map((d) => d.date)
    .filter((_, i) => i % tickInterval === 0);
  const lastDate = biggerFiltered[biggerFiltered.length - 1]?.date;
  if (lastDate && !tickValues.includes(lastDate)) {
    tickValues.push(lastDate);
  }

  // Y range
  const computedYMin = yMin === "auto" ? "auto" : Number(yMin);
  const computedYMax = yMax === "auto" ? "auto" : Number(yMax);

  // areaBaseline => combined min from both sets
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

  return (
    <Card style={{ backgroundColor: "#fff" }} className={cn("p-4", isEditable && "border-primary")}>
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

      {/* If not editable, skip the rest */}
      {isEditable && (
        <>
          {/* Local slider */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Date Range</label>
            <Slider.Root
              value={dateRange}
              onValueChange={(val) => setDateRange([val[0], val[1]] as [number, number])}
              min={0}
              // the max is whichever dataset might be largest. 
              // If second data is unknown or smaller, we do a safe approach:
              max={Math.max(validData.length, fetchedSecondData?.length ?? 0)}
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
              {/* Color picker for primary */}
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

              {/* Toggle Show Points */}
              <div className="flex items-center gap-2">
                <Switch checked={showPoints} onCheckedChange={setShowPoints} id="showPoints" />
                <label htmlFor="showPoints" className="text-sm">
                  Show Points
                </label>
              </div>

              {/* Always show the second series toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={showSecondSeries}
                  onCheckedChange={setShowSecondSeries}
                  id="secondSeries"
                />
                <label htmlFor="secondSeries" className="text-sm">
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

                  {searchError && <p className="text-red-500 text-sm">{searchError}</p>}

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

      {/* Chart area */}
      <div className="h-[350px] w-full bg-white">
        {!hasEnoughPoints ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Not enough data to display a chart.
          </div>
        ) : (
          <ResponsiveLine
            data={finalChartData}
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
              tickPadding: 5,
              tickRotation: -30,
              tickValues,
              legend: "Date",
              legendOffset: 45,
              legendPosition: "middle",
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              legend: "Value",
              legendOffset: -60,
              legendPosition: "middle",
              format: (val) =>
                Number(val).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                }),
            }}
            curve="linear"
            useMesh
            enableSlices={false}
            enableArea
            areaOpacity={0.1}
            areaBaselineValue={areaBaselineValue}
            // We'll see both lines if second dataset is toggled & fetched
            colors={({ datum, series }) => series.color ?? "#6E59A5"}
            enablePoints={showPoints}
            pointSize={6}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            theme={{
              background: "#fff",
              axis: {
                ticks: { text: { fill: "#666" } },
                legend: { text: { fill: "#666" } },
              },
              grid: {
                line: { stroke: "#fff", strokeWidth: 0 },
              },
            }}
          />
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2 text-right">
        Source: Federal Reserve Economic Data (FRED)
      </p>
    </Card>
  );
}