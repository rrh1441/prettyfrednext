"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useIndicatorData } from "@/hooks/useIndicatorData";
import EconomicChart from "@/app/components/EconomicChart";
// If using Card/Button from your new UI folder:
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

/** The 8 uneditable series */
const SERIES = [
  "GDP",
  "UNRATE",
  "CPIAUCSL",
  "FEDFUNDS",
  "GS10",
  "PAYEMS",
  "M2SL",
  "M2V",
];

// Helper to transform DB rows => { date, value } plus a 'description'
function transformIndicatorData(rows: any[] | undefined) {
  if (!rows || rows.length === 0) {
    return { data: [], description: "Loading..." };
  }
  const description = rows[0].economic_indicators?.description || "No description";
  const data = rows.map((r) => {
    const d = new Date(r.date);
    const label = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    return { date: label, value: r.value ?? 0 };
  });
  return { data, description };
}

export default function HomePage() {
  // 1) top chart = GDPC1 (editable)
  const { data: gdpc1Rows, isLoading: gdpc1Loading, error: gdpc1Error } =
    useIndicatorData("GDPC1");
  const gdpc1 = transformIndicatorData(gdpc1Rows);

  // 2) fetch the other 8 series
  const seriesHooks = SERIES.map((id) => ({
    id,
    ...useIndicatorData(id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Title + Sign in / Sign up */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PrettyFRED (Next.js)</h1>
          <p className="text-xl text-gray-600 mb-8">
            Beautiful Economic Data Visualization
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="bg-white hover:bg-gray-100">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
          </div>
        </div>

        {/* Info card (left) + top chart (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Visualize Economic Data</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary">Basic (Free)</h3>
                <ul className="list-disc list-inside text-gray-600 ml-4">
                  <li>Access to key economic indicators</li>
                  <li>Basic visualization options</li>
                  <li>Monthly data updates</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-primary">Premium</h3>
                <ul className="list-disc list-inside text-gray-600 ml-4">
                  <li>Advanced customization tools</li>
                  <li>Real-time data updates</li>
                  <li>Export data in multiple formats</li>
                  <li>API access</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* GDPC1 chart (editable) */}
          {gdpc1Loading ? (
            <div className="flex items-center justify-center h-80">
              Loading GDPC1...
            </div>
          ) : gdpc1Error ? (
            <div className="text-red-500">Error: {(gdpc1Error as Error).message}</div>
          ) : (
            <EconomicChart
              title={gdpc1.description}
              subtitle="(Real Gross Domestic Product)"
              data={gdpc1.data}
              color="#6E59A5"
              isEditable
            />
          )}
        </div>

        {/* The 8 uneditable series below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesHooks.map(({ id, data: rows, isLoading, error }) => {
            const { data, description } = transformIndicatorData(rows);

            if (isLoading) {
              return (
                <div key={id} className="flex items-center justify-center h-80">
                  Loading {id}...
                </div>
              );
            }
            if (error) {
              return (
                <div key={id} className="text-red-500 h-80 border border-dashed">
                  Error with {id}: {(error as Error).message}
                </div>
              );
            }

            let sub = "";
            switch (id) {
              case "GDP":
                sub = "(Gross Domestic Product)";
                break;
              case "UNRATE":
                sub = "(Civilian Unemployment Rate)";
                break;
              case "CPIAUCSL":
                sub = "(Consumer Price Index for All Urban Consumers)";
                break;
              case "FEDFUNDS":
                sub = "(Effective Federal Funds Rate)";
                break;
              case "GS10":
                sub = "(10-Year Treasury Constant Maturity Rate)";
                break;
              case "PAYEMS":
                sub = "(All Employees: Total Nonfarm Payrolls)";
                break;
              case "M2SL":
                sub = "(M2 Money Stock - DISCONTINUED)";
                break;
              case "M2V":
                sub = "(Velocity of M2 Money Stock)";
                break;
            }

            return (
              <EconomicChart
                key={id}
                title={description}
                subtitle={sub}
                data={data}
                color="#666"
                isEditable={false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}