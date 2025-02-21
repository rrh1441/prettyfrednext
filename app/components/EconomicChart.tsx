"use client";

import { Card } from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/** A single data point. E.g. { date: 'Jan 2020', value: 123 } */
interface DataPoint {
  date: string;
  value: number | null; // might be null in DB, so let's handle that
}

interface EconomicChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
  color?: string;     // default color for editable chart
  isEditable?: boolean;
}

export default function EconomicChart({
  title: initialTitle,
  subtitle,
  data,
  color = "#6E59A5",
  isEditable = false,
}: EconomicChartProps) {
  // 1) Clean up raw data: remove points where .value is null
  const validData = data.filter((d) => d.value !== null);

  // 2) If chart is not editable, override with a more "beautiful" color
  const defaultNonEditableColor = "#7E69AB";
  const chartColorDefault = isEditable ? color : defaultNonEditableColor;

  // 3) Editable states
  const [title, setTitle] = useState(initialTitle);
  const [chartColor, setChartColor] = useState(chartColorDefault);
  const [yMin, setYMin] = useState<string>("auto");
  const [yMax, setYMax] = useState<string>("auto");
  const [showPoints, setShowPoints] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 4) Date range slider [startIndex, endIndex]
  const [dateRange, setDateRange] = useState<[number, number]>([
    0,
    validData.length,
  ]);

  // 5) Filter valid data by dateRange
  const filteredData = validData.slice(dateRange[0], dateRange[1]);

  // 6) If we have fewer than 2 points, skip drawing the line
  const hasEnoughPoints = filteredData.length >= 2;

  // 7) Build Nivo data
  const transformedData = hasEnoughPoints
    ? [
        {
          id: title,
          color: chartColor,
          data: filteredData.map((d) => ({
            x: d.date,
            y: d.value ?? 0,
          })),
        },
      ]
    : [];

  // 8) X-axis tick logic, using date labels
  const tickInterval = hasEnoughPoints ? Math.ceil(filteredData.length / 12) : 1;
  const tickValues = filteredData
    .map((d) => d.date)
    .filter((_, idx) => idx % tickInterval === 0);

  // 9) Ensure "auto" yMin starts at 0 (so area doesn't go below the x-axis).
  //    If the user sets a numeric value, we respect it (even if negative).
  const computedYMin = yMin === "auto" ? 0 : Number(yMin);
  const computedYMax = yMax === "auto" ? "auto" : Number(yMax);

  return (
    <Card
      /* Card background forced to white */
      style={{ backgroundColor: "#fff" }}
      className={cn("p-4", isEditable && "border-primary")}
    >
      {/* Title */}
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

      {/* Editable controls */}
      {isEditable && (
        <>
          <div className="space-y-4 mb-4">
            {/* Date Range Slider */}
            <div>
              <label className="block text-sm mb-1">Date Range</label>
              <Slider.Root
                value={dateRange}
                onValueChange={(val) =>
                  setDateRange([val[0], val[1]] as [number, number])
                }
                min={0}
                max={validData.length}
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
                <span>{filteredData[0]?.date ?? ""}</span>
                <span>
                  {filteredData[filteredData.length - 1]?.date ?? ""}
                </span>
              </div>
            </div>

            {/* Show/hide points */}
            <div className="flex items-center gap-2">
              <Switch
                checked={showPoints}
                onCheckedChange={setShowPoints}
                id="showPoints"
              />
              <label htmlFor="showPoints" className="text-sm">
                Show Points
              </label>
            </div>
          </div>

          {/* Expandable advanced settings */}
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="mb-4 underline text-sm text-gray-800 hover:text-gray-900"
          >
            {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 mb-4 border border-gray-100 p-3 rounded">
              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <label className="text-sm w-16">Color:</label>
                <input
                  type="color"
                  value={chartColor}
                  onChange={(e) => setChartColor(e.target.value)}
                  className="w-12 h-8 border p-0"
                />
              </div>

              {/* Y-axis Range */}
              <div className="flex items-center gap-2">
                <label className="text-sm w-16">Y Range:</label>
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
            </div>
          )}
        </>
      )}

      {/* Chart Container: Force white background */}
      <div className="h-[350px] w-full bg-white">
        {/* If not enough valid data, show fallback */}
        {!hasEnoughPoints ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Not enough data to display a chart.
          </div>
        ) : (
          <ResponsiveLine
            data={transformedData}
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
            // Ensures area only fills down to y=0, not below
            areaBaselineValue={0}
            colors={[chartColor]}
            enablePoints={showPoints}
            pointSize={6}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            theme={{
              // Force the chart background to white
              background: "#fff",
              axis: {
                ticks: {
                  text: {
                    fill: "#666",
                  },
                },
                legend: {
                  text: {
                    fill: "#666",
                  },
                },
              },
              // Remove or hide grid lines by making them white & zero-width
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

      <p className="text-xs text-gray-500 mt-2 text-right">
        Source: Federal Reserve Economic Data (FRED)
      </p>
    </Card>
  );
}
