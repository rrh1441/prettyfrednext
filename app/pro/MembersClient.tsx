/* FILE: app/pro/MembersClient.tsx */

"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent
} from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";
import EconomicChart from "@/components/EconomicChart";
import Card from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SeriesData } from "./page";

interface SeriesMeta {
  series_id: string;
  description: string;
}

/** Row shape from 'fred_data'. */
interface FredRow {
  date: string;
  value: number | null;
}

interface MembersClientProps {
  initialSeries: SeriesData[];            // first 10 (loaded) from SSR
  remainingSeriesMetadata: SeriesMeta[];  // the rest (metadata only)
  allSeriesList: SeriesMeta[];           // entire full list for "Show All Series" popup
}

export default function MembersClient({
  initialSeries,
  remainingSeriesMetadata,
  allSeriesList,
}: MembersClientProps) {
  // 1) State: loaded series, pinned IDs, leftover, search
  const [loadedSeries, setLoadedSeries] = useState<SeriesData[]>(initialSeries);
  const [unused, setUnused] = useState<SeriesMeta[]>(remainingSeriesMetadata);
  const [pinnedIDs, setPinnedIDs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Popups
  const [showAllSeriesModal, setShowAllSeriesModal] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // 2) Chart Refs for exporting images
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 3) Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // ---- Helper to fetch row data from Supabase
  const fetchSeriesRows = useCallback(async (metas: SeriesMeta[]): Promise<SeriesData[]> => {
    const results: SeriesData[] = [];

    for (const m of metas) {
      const { data: rows, error } = await supabase
        .from("fred_data")
        .select("date, value")
        .eq("series_id", m.series_id)
        .order("date", { ascending: false })
        .limit(2500);

      if (error) {
        console.warn("Error fetching", m.series_id, error.message);
        continue;
      }

      // reverse so final array is oldest->newest
      const reversed = (rows ?? []).reverse();
      const chartData = reversed.map((r: FredRow) => ({
        date: r.date,
        value: r.value,
      }));

      results.push({
        series_id: m.series_id,
        description: m.description,
        data: chartData,
      });
    }

    return results;
  }, []);

  // ---- loadNextChunk: fetch next 10 from unused
  const loadNextChunk = useCallback(async () => {
    if (loadingMore || unused.length === 0) return;
    setLoadingMore(true);

    const chunk = unused.slice(0, 10);
    const newData = await fetchSeriesRows(chunk);

    setLoadedSeries((prev) => [...prev, ...newData]);
    setUnused((prev) => prev.slice(10));

    setLoadingMore(false);
  }, [loadingMore, unused, fetchSeriesRows]);

  // IntersectionObserver for infinite scrolling
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadNextChunk();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => {
      observer.unobserve(node);
    };
  }, [loadNextChunk]);

  // ---- Searching
  async function handleSearch() {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return;

    const { data: found, error } = await supabase
      .from("economic_indicators")
      .select("series_id, description")
      .or(`series_id.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(20);

    if (error || !found) {
      console.warn("Search error:", error?.message);
      return;
    }

    // Filter out items we already have
    const toFetch: SeriesMeta[] = [];
    for (const f of found) {
      if (!loadedSeries.some((ls) => ls.series_id === f.series_id)) {
        toFetch.push({ series_id: f.series_id, description: f.description });
      }
    }

    if (toFetch.length > 0) {
      const newlyFetched = await fetchSeriesRows(toFetch);
      setLoadedSeries((prev) => [...prev, ...newlyFetched]);
      setUnused((prev) => prev.filter((u) => !toFetch.some((tf) => tf.series_id === u.series_id)));
    }
  }

  // ---- Pin logic
  function togglePin(seriesId: string) {
    setPinnedIDs((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  }

  // ---- final displayed list
  const term = searchTerm.toLowerCase().trim();
  let displayed = loadedSeries;
  if (term) {
    displayed = displayed.filter((s) =>
      (s.series_id + s.description).toLowerCase().includes(term)
    );
  }

  const pinned = displayed.filter((s) => pinnedIDs.includes(s.series_id));
  const unpinned = displayed.filter((s) => !pinnedIDs.includes(s.series_id));

  // ---- Export logic
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

  // ---- Request a data series form
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

  // ---- Render
  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search by series_id or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outline" onClick={() => setShowAllSeriesModal(true)}>
          Show All Series
        </Button>
        <Button onClick={() => setShowRequestForm(true)}>
          Request a Data Series
        </Button>
      </div>

      {/* PINNED */}
      {pinned.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Pinned Charts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {pinned.map((series) => (
              <Card key={series.series_id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">
                    {series.series_id} - {series.description}
                  </h3>
                  <Button variant="outline" onClick={() => togglePin(series.series_id)}>
                    Unpin
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
                    color="#6E59A5"
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
        </>
      )}

      {/* UNPINNED */}
      <h2 className="text-xl font-semibold mb-2">All Charts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {unpinned.map((series) => (
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

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-10 w-full" />
      {loadingMore && <div className="text-center mt-2">Loading more...</div>}

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