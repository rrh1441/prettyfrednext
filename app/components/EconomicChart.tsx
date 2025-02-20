"use client";

import { Card } from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/** Data shape: e.g. { date: "Jan 2020", value: 123.45 } */
interface DataPoint {
  date: string;
  value: number;
}

interface EconomicChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
  color?: string;
  isEditable?: boolean;
}

export default function EconomicChart({
  title: initialTitle,
  subtitle,
  data,
  color = "#6E59A5",
  isEditable = false,
}: EconomicChartProps) {
  // 1) chart color
  const [chartColor, setChartColor] = useState(color);

  // 2) Y-axis range
  const [yMin, setYMin] = useState<string>("auto");
  const [yMax, setYMax] = useState<string>("auto");

  // 3) chart title
  const [title, setTitle] = useState(initialTitle);

  // 4) show/hide chart points/labels
  const [showPoints, setShowPoints] = useState(false);

  // 5) date range slider
  //    We'll store [startIndex, endIndex], then slice data accordingly
  const [dateRange, setDateRange] = useState<[number, number]>([0, data.length]);

  // Filter the data according to dateRange
  const filteredData = data.slice(dateRange[0], dateRange[1]);

  // Build Nivo data
  const transformedData = [
    {
      id: title,
      color: chartColor,
      data: filteredData.map((d) => ({
        x: d.date,
        y: d.value,
      })),
    },
  ];

  // Limit the number of x-axis ticks to avoid overlap.
  // E.g. 12 ticks max:
  const tickInterval = Math.ceil(filteredData.length / 12);
  const tickValues = filteredData
    .map((_, idx) => (idx % tickInterval === 0 ? idx : null))
    .filter((idx) => idx !== null);

  return (
    <Card className={cn("p-4", isEditable && "border-primary")}>
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

      {isEditable && (
        <div className="space-y-4 mb-4">
          {/* Color picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm w-16">Color:</label>
            <input
              type="color"
              value={chartColor}
              onChange={(e) => setChartColor(e.target.value)}
              className="w-12 h-8 border p-0"
            />
          </div>

          {/* Y range */}
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

          {/* Date range slider */}
          <div>
            <label className="block text-sm mb-1">Date Range</label>
            <Slider
              value={dateRange}
              onValueChange={(val) => {
                // Ensure we store a tuple
                setDateRange([val[0], val[1]] as [number, number]);
              }}
              min={0}
              max={data.length}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{filteredData[0]?.date ?? ""}</span>
              <span>{filteredData[filteredData.length - 1]?.date ?? ""}</span>
            </div>
          </div>
        </div>
      )}

      <div className="h-[300px] w-full">
        <ResponsiveLine
          data={transformedData}
          margin={{ top: 50, right: 20, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: yMin === "auto" ? "auto" : Number(yMin),
            max: yMax === "auto" ? "auto" : Number(yMax),
            stacked: false,
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            // Nivo can accept numeric indices if xScale is "point".
            // We'll pass the array of indexes we want to show as tick values.
            tickValues, 
            legend: "Date",
            legendOffset: 40,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: "Value",
            legendOffset: -50,
            legendPosition: "middle",
            format: (val) =>
              Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 }),
          }}
          curve="linear"
          enableSlices={false}
          useMesh={true}
          enableArea={true}
          areaOpacity={0.1}
          colors={[chartColor]}
          enablePoints={showPoints}
          enablePointLabel={false}
          pointSize={6}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          theme={{
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
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">
        Source: Federal Reserve Economic Data (FRED)
      </p>
    </Card>
  );
}