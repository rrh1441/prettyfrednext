"use client";

import Image from "next/image";
import { LogIn, UserPlus } from "lucide-react";
import { useIndicatorData, FredRow } from "@/hooks/useIndicatorData";
import EconomicChart from "@/components/EconomicChart";
import SubscriptionCard from "@/components/ui/SubscriptionCard";
import { Button } from "@/components/ui/button";

/** 
 * Removes the "?? 0" fallback so `null` stays `null`, allowing gaps in the chart.
 */
function transformIndicatorData(rows: FredRow[] | undefined) {
  if (!rows || rows.length === 0) {
    return { data: [], description: "Loading..." };
  }

  const description = rows[0].economic_indicators?.description ?? "No description";
  const data = rows.map((r) => {
    const dateObj = new Date(r.date);
    const label = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    // Keep r.value as-is to preserve null (for gaps in the chart).
    return { date: label, value: r.value };
  });

  return { data, description };
}

export default function HomePage() {
  // Top chart: GDPC1 (Real GDP, Chained 2012 Dollars)
  const gdpc1Query = useIndicatorData("GDPC1");
  const gdpc1 = transformIndicatorData(gdpc1Query.data);

  // Other series queries:
  const gdpQuery = useIndicatorData("GDP"); 
  const unrateQuery = useIndicatorData("UNRATE");
  const cpiQuery = useIndicatorData("CPIAUCSL");
  const fedFundsQuery = useIndicatorData("FEDFUNDS");
  const dgs10Query = useIndicatorData("DGS10");
  const payemsQuery = useIndicatorData("PAYEMS");
  const sp500Query = useIndicatorData("SP500");
  const m2slQuery = useIndicatorData("M2SL");

  // 8 non-editable series
  const subSeries = [
    { id: "GDP", query: gdpQuery },
    { id: "UNRATE", query: unrateQuery },
    { id: "CPIAUCSL", query: cpiQuery },
    { id: "PAYEMS", query: payemsQuery },
    { id: "FEDFUNDS", query: fedFundsQuery },
    { id: "DGS10", query: dgs10Query },
    { id: "SP500", query: sp500Query },
    { id: "M2SL", query: m2slQuery },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          {/* Replace the <h1> with a centered logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/prettyfred-logo.png"
              alt="PrettyFRED Logo"
              width={300}   // adjust width
              height={150}  // adjust height or ratio
              priority      // optionally helps load faster
            />
          </div>

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

        {/* Grid with subscription card on the left and top chart (GDPC1) on the right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SubscriptionCard onSubscribe={() => console.log("Subscribe CTA clicked")} />
          {gdpc1Query.isLoading ? (
            <div className="flex items-center justify-center h-80">
              Loading GDPC1...
            </div>
          ) : gdpc1Query.error ? (
            <div className="text-red-500">
              Error: {(gdpc1Query.error as Error).message}
            </div>
          ) : (
            <EconomicChart
              title={gdpc1.description}
              subtitle="(Real Gross Domestic Product (Chained 2012 Dollars))"
              data={gdpc1.data}
              color="#6E59A5"
              isEditable
            />
          )}
        </div>

        {/* 8 non-editable series below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subSeries.map(({ id, query }) => {
            const { data: rows, isLoading, error } = query;
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
                sub = "(Gross Domestic Product (Nominal))";
                break;
              case "UNRATE":
                sub = "(Civilian Unemployment Rate)";
                break;
              case "CPIAUCSL":
                sub = "(Consumer Price Index for All Urban Consumers: All Items)";
                break;
              case "PAYEMS":
                sub = "(Total Nonfarm Payrolls)";
                break;
              case "FEDFUNDS":
                sub = "(Effective Federal Funds Rate)";
                break;
              case "DGS10":
                sub = "(10-Year Treasury Constant Maturity Rate)";
                break;
              case "SP500":
                sub = "(S&P 500 Index)";
                break;
              case "M2SL":
                sub = "(M2 Money Stock)";
                break;
              default:
                sub = "";
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