"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";            // for navigation
import html2canvas from "html2canvas";
import { LogIn, UserPlus } from "lucide-react";

import { useIndicatorData, FredRow } from "@/hooks/useIndicatorData";
import EconomicChart from "@/components/EconomicChart";
import SubscriptionCard from "@/components/ui/SubscriptionCard";
import { Button } from "@/components/ui/button";

/** 
 * Removes "?? 0" fallback so `null` stays `null`, 
 * preserving gaps in the chart.
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
    return { date: label, value: r.value }; 
  });

  return { data, description };
}

export default function HomePage() {
  // 1) Now we fetch "GDP" (Nominal GDP) instead of "GDPC1".
  const gdpQuery = useIndicatorData("GDP");
  const gdp = transformIndicatorData(gdpQuery.data);

  // 2) The other series are unchanged
  const unrateQuery = useIndicatorData("UNRATE");
  const cpiQuery = useIndicatorData("CPIAUCSL");
  const fedFundsQuery = useIndicatorData("FEDFUNDS");
  const dgs10Query = useIndicatorData("DGS10");
  const payemsQuery = useIndicatorData("PAYEMS");
  const sp500Query = useIndicatorData("SP500");
  const m2slQuery = useIndicatorData("M2SL");

  // 3) Sub-series remain the same
  const subSeries = [
    { id: "UNRATE",  query: unrateQuery },
    { id: "CPIAUCSL", query: cpiQuery },
    { id: "PAYEMS",   query: payemsQuery },
    { id: "FEDFUNDS", query: fedFundsQuery },
    { id: "DGS10",    query: dgs10Query },
    { id: "SP500",    query: sp500Query },
    { id: "M2SL",     query: m2slQuery },
    { id: "GDP",      query: useIndicatorData("GDP") }, 
    // e.g. if you still want "GDP" repeated in subSeries
  ];

  // 4) We'll store a ref for exporting the single editable chart
  const chartRef = useRef<HTMLDivElement | null>(null);

  // 4A) Helper: Export PNG
  async function handleExportPNG() {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "chart.png";
    link.click();
  }

  // 4B) Helper: Export JPG
  async function handleExportJPG() {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "chart.jpg";
    link.click();
  }

  // 4C) Helper: Export CSV
  function handleExportCSV() {
    if (!gdp.data || gdp.data.length === 0) return; 
    let csv = "date,value\n";
    gdp.data.forEach((pt) => {
      csv += `${pt.date},${pt.value ?? ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chart.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Logo / Sign in / Sign up */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/prettyfred-logo.png"
              alt="PrettyFRED Logo"
              width={600}
              height={200}
              priority
            />
          </div>

          {/* Buttons that link to /login and /signup */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="bg-white hover:bg-gray-100" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>

            <Button asChild>
              <Link href="/signup">
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </div>
        </div>

        {/* Subscription card on left, top chart (Nominal GDP) on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SubscriptionCard onSubscribe={() => console.log("Subscribe CTA clicked")} />
          {gdpQuery.isLoading ? (
            <div className="flex items-center justify-center h-80">
              Loading GDP...
            </div>
          ) : gdpQuery.error ? (
            <div className="text-red-500">
              Error: {(gdpQuery.error as Error).message}
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Put the chart in a ref container */}
              <div ref={chartRef}>
                <EconomicChart
                  title={gdp.description}
                  subtitle=""  // e.g. omit or set a short label
                  data={gdp.data}
                  color="#6E59A5"
                  isEditable
                />
              </div>
              {/* Export buttons for the editable chart */}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={handleExportPNG}>
                  Export PNG
                </Button>
                <Button variant="outline" onClick={handleExportJPG}>
                  Export JPG
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  Export CSV
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 8 sub-series below */}
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
              case "GDP":
                sub = "(Gross Domestic Product (Nominal))";
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