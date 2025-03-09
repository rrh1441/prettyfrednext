"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";
import EconomicChart from "@/components/EconomicChart";
import Card from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FredRow {
  date: string;
  value: number | null;
}

/**
 * Each chart's data shape.
 */
interface SeriesData {
  series_id: string;
  description: string;
  data: { date: string; value: number | null }[];
}

/**
 * Minimal shape for your "remainingSeriesMetadata" & "allSeriesList".
 */
interface SeriesMeta {
  series_id: string;
  description: string;
}

interface MembersClientProps {
  // We still accept some initial data from SSR if you want,
  // but in this example we’ll just re-fetch everything for clarity.
  initialSeries: SeriesData[];
  remainingSeriesMetadata: SeriesMeta[];
  allSeriesList: SeriesMeta[]; 
}

export default function MembersClient({
  initialSeries,
  remainingSeriesMetadata,
  allSeriesList,
}: MembersClientProps) {
  // -----------------------------
  //    1) STATE & REFS
  // -----------------------------
  const [allSeries, setAllSeries] = useState<SeriesData[]>([]); // entire dataset
  const [pinnedIDs, setPinnedIDs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // For popups / modals
  const [showAllSeriesModal, setShowAllSeriesModal] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Export references
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1); // 1-based
  const pageSize = 20;

  // -----------------------------
  //    2) FETCH ALL CHART DATA
  // -----------------------------
  /**
   * We do one-time fetch of all chart data from your "fred_data" table
   * for the entire "allSeriesList" if you want full-dataset searching.
   * (In reality, you might do this SSR to avoid big client fetch.)
   */
  useEffect(() => {
    async function fetchAll() {
      try {
        // For each SeriesMeta, fetch up to e.g. 2500 rows
        const results: SeriesData[] = [];
        for (const meta of allSeriesList) {
          const { data: rows, error } = await supabase
            .from("fred_data")
            .select("date, value")
            .eq("series_id", meta.series_id)
            .order("date", { ascending: true }); // or descending

          if (error) {
            console.warn("Error fetching series_id=", meta.series_id, error.message);
            continue;
          }
          const chartData = (rows ?? []).map((r: FredRow) => ({
            date: r.date,
            value: r.value,
          }));
          results.push({
            series_id: meta.series_id,
            description: meta.description,
            data: chartData,
          });
        }
        setAllSeries(results);
      } catch (err) {
        console.error("Error fetching all series data:", err);
      }
    }
    fetchAll();
  }, [allSeriesList]);

  // -----------------------------
  //    3) PIN / UNPIN LOGIC
  // -----------------------------
  function togglePin(seriesId: string) {
    setPinnedIDs((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  }

  // -----------------------------
  //    4) SEARCH FILTER
  // -----------------------------
  const normalizedSearch = searchTerm.trim().toLowerCase();
  let filtered = allSeries;

  if (normalizedSearch) {
    filtered = allSeries.filter(
      (s) =>
        s.series_id.toLowerCase().includes(normalizedSearch) ||
        s.description.toLowerCase().includes(normalizedSearch)
    );
  }

  // -----------------------------
  //    5) PINNED vs UNPINNED
  // -----------------------------
  const pinned = filtered.filter((s) => pinnedIDs.includes(s.series_id));
  const unpinned = filtered.filter((s) => !pinnedIDs.includes(s.series_id));

  // Then combine them (pinned first):
  const combined = [...pinned, ...unpinned];

  // -----------------------------
  //    6) PAGINATION SLICING
  // -----------------------------
  const totalItems = combined.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // For safety, clamp currentPage if search changed
  useEffect(() => {
    // If current page is out of range after searching
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayedCharts = combined.slice(startIndex, endIndex);

  // -----------------------------
  //    7) EXPORT HANDLERS
  // -----------------------------
  async function handleExportPng(seriesId: string) {
    const node = chartRefs.current[seriesId];
    if (!node) return;
    const canvas = await html2canvas(node);
    const dataUrl = canvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, `${seriesId}.png`);
  }

  async function handleExportJpg(seriesId: string) {
    const node = chartRefs.current[seriesId];
    if (!node) return;
    const canvas = await html2canvas(node);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    downloadDataUrl(dataUrl, `${seriesId}.jpg`);
  }

  function handleExportCsv(series: SeriesData) {
    let csv = "date,value\n";
    series.data.forEach((pt) => {
      csv += `${pt.date},${pt.value ?? ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${series.series_id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadDataUrl(dataUrl: string, filename: string) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  // -----------------------------
  //    8) REQUEST FORM SUBMIT
  // -----------------------------
  async function handleRequestSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const requested_series_id = formData.get("requested_series_id")?.toString() || "";
    const notes = formData.get("notes")?.toString() || "";

    if (!requested_series_id) {
      alert("Please enter a series ID!");
      return;
    }

    const { error } = await supabase
      .from("series_requests")
      .insert([{ requested_series_id, notes }]);

    if (error) {
      alert(`Error submitting request: ${error.message}`);
    } else {
      alert("Request submitted successfully!");
      setShowRequestForm(false);
    }
  }

  // -----------------------------
  //    9) RENDER
  // -----------------------------
  return (
    <div className="p-4">
      {/* Top Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search by series_id or description..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset to page 1 on new search
          }}
        />
        <Button variant="outline" onClick={() => setShowAllSeriesModal(true)}>
          Show All Series
        </Button>
        <Button onClick={() => setShowRequestForm(true)}>
          Request a Data Series
        </Button>
      </div>

      {/* PAGE CONTROLS */}
      <div className="flex items-center mb-4 gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous Page
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next Page
        </Button>
      </div>

      {/* MAIN LIST OF CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedCharts.map((series) => (
          <Card key={series.series_id} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">
                {series.series_id} - {series.description}
              </h3>
              <Button variant="outline" onClick={() => togglePin(series.series_id)}>
                {pinnedIDs.includes(series.series_id) ? "Unpin" : "Pin"}
              </Button>
            </div>

            <div
              ref={(el) => {
                chartRefs.current[series.series_id] = el;
              }}
            >
              <EconomicChart
                title={series.description}
                subtitle={series.series_id}
                data={series.data}
                color="#7E69AB"
                isEditable
              />
            </div>

            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => handleExportPng(series.series_id)}>
                PNG
              </Button>
              <Button variant="outline" onClick={() => handleExportJpg(series.series_id)}>
                JPG
              </Button>
              <Button variant="outline" onClick={() => handleExportCsv(series)}>
                CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination repeated at bottom (optional) */}
      {displayedCharts.length > 0 && (
        <div className="flex items-center mt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous Page
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next Page
          </Button>
        </div>
      )}

      {/* SHOW ALL SERIES MODAL */}
      {showAllSeriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 w-full max-w-xl relative">
            <h2 className="text-xl font-semibold mb-4">All Series in Database</h2>
            <ul className="max-h-96 overflow-y-auto list-disc pl-5">
              {allSeriesList.map((s) => (
                <li key={s.series_id} className="mb-1">
                  <strong>{s.series_id}</strong> - {s.description}
                </li>
              ))}
            </ul>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setShowAllSeriesModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* REQUEST A DATA SERIES MODAL */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-4 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4">Request a Data Series</h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Desired Series ID
                </label>
                <Input type="text" name="requested_series_id" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes / Rationale
                </label>
                <textarea
                  name="notes"
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}