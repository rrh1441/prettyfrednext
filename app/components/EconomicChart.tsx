"use client";

import { Card } from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { useState } from "react";
// If you have input/switch/slider in "app/components/ui", import them here
// import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
// import { Slider } from "@/components/ui/slider";
// import { Label } from "@/components/ui/label";

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
  const [chartColor, setChartColor] = useState(color);
  const [yMin, setYMin] = useState("auto");
  const [yMax, setYMax] = useState("auto");
  const [title, setTitle] = useState(initialTitle);

  // if you have dateRange from a slider, define it here
  // ...
  const filteredData = data; // or data.slice(dateRange[0], dateRange[1])

  const transformedData = [
    {
      id: title,
      color: chartColor,
      data: filteredData.map((d) => ({ x: d.date, y: d.value })),
    },
  ];

  return (
    <Card className={`p-4 ${isEditable ? "border-primary" : ""}`}>
      {isEditable ? (
        // If you have an Input component
        // <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold mb-2 border p-1 focus:outline-none"
        />
      ) : (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      <p className="text-sm text-gray-600 mb-4">{subtitle}</p>

      {/* If you have color pickers / Y-axis range, place them here */}
      
      <div className="h-[300px] w-full">
        <ResponsiveLine
          data={transformedData}
          margin={{ top: 50, right: 20, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: yMin === "auto" ? "auto" : Number(yMin),
            max: yMax === "auto" ? "auto" : Number(yMax),
          }}
          curve="natural"
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
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
          enableSlices={false}
          enableArea
          areaOpacity={0.1}
          enablePoints
          pointSize={8}
          pointBorderWidth={1}
          colors={[chartColor]}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">
        Source: Federal Reserve Economic Data (FRED)
      </p>
    </Card>
  );
}