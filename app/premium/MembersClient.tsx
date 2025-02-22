"use client";

import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";
import EconomicChart from "@/components/EconomicChart";
import Card from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SeriesData } from "./page";

/** The leftover items we haven't loaded row data for yet. */
interface SeriesMeta {
  series_id: string;
  description: string;
}

interface MembersClientProps {
  initialSeries: SeriesData[]; // first 10 fully loaded
  remainingSeriesMetadata: SeriesMeta[];
}

export default function MembersClient({
  initialSeries,
  remainingSeriesMetadata,
}: MembersClientProps) {
  // All loaded data (SSR + anything we fetch via infinite scroll or search)
  const [loadedSeries, setLoadedSeries] = useState<SeriesData[]>(initialSeries);

  // The leftover metadata to load in chunks of 10
  const [unused, setUnused] = useState<SeriesMeta[]>(remainingSeriesMetadata);

  // Keep track of pinned IDs
  const [pinnedIDs, setPinnedIDs] = useState<string[]>([]);

  // Search term
  const [searchTerm, setSearchTerm] = useState("");

  // For infinite scroll, we watch this "sentinel" ref
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Chart refs for export
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Are we currently loading the next chunk so we don't double-load?
  const [loadingMore, setLoadingMore] = useState(false);

  // ---- Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting) {
          // We hit the bottom => try loading next chunk
          loadNextChunk();
        }
      },
      { threshold: 1.0 } // fully in view
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [sentinelRef.current, unused, loadingMore]);

  // This loads the next chunk of 10 from "unused"
  async function loadNextChunk() {
    if (loadingMore) return; // already loading
    if (unused.length === 0) return; // nothing left to load

    setLoadingMore(true);

    const chunk = unused.slice(0, 10);
    // Fetch row data for these chunk items
    const newData = await fetchSeriesRows(chunk);

    // Add them to loaded
    setLoadedSeries((prev) => [...prev, ...newData]);

    // Remove them from unused
    setUnused((prev) => prev.slice(10));

    setLoadingMore(false);
  }

  // Helper: fetch row data from "fred_data" for an array of series metas
  async function fetchSeriesRows(metas: SeriesMeta[]): Promise<SeriesData[]> {
    const results: SeriesData[] = [];
    for (const m of metas) {
      const { data: rows, error } = await supabase
        .from("fred_data")
        .select("date, value")
        .eq("series_id", m.series_id)
        .order("date", { ascending: true });

      if (error) {
        console.warn("Error fetching", m.series_id, error.message);
        continue;
      }
      const chartData = (rows ?? []).map((r: any) => ({
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
  }

  // ---- SEARCH: fetch new series if not already loaded
  async function handleSearch() {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return;

    const { data: found, error } = await supabase
      .from("economic_indicators")
      .select("series_id, description")
      .ilike("series_id", `%${term}%`) // or .ilike("description", `%${term}%`)
      .limit(20);

    if (error || !found) {
      console.warn("Search error:", error?.message);
      return;
    }

    // Filter out series we already loaded
    const toFetch: SeriesMeta[] = [];
    for (const f of found) {
      if (!loadedSeries.some((ls) => ls.series_id === f.series_id)) {
        // not loaded
        toFetch.push({ series_id: f.series_id, description: f.description });
      }
    }

    if (toFetch.length > 0) {
      const newlyFetched = await fetchSeriesRows(toFetch);
      setLoadedSeries((prev) => [...prev, ...newlyFetched]);
      // Also remove them from 'unused' if they exist
      setUnused((prev) => prev.filter((u) => !toFetch.some((tf) => tf.series_id === u.series_id)));
    }
  }

  // ---- Pin logic
  function togglePin(seriesId: string) {
    setPinnedIDs((prev) =>
      prev.includes(seriesId) ? prev.filter((id) => id !== seriesId) : [...prev, seriesId]
    );
  }

  // ---- Filter + pinned sorting
  const term = searchTerm.toLowerCase().trim();
  let displayed = loadedSeries;
  if (term) {
    displayed = displayed.filter((s) => {
      const combined = (s.series_id + s.description).toLowerCase();
      return combined.includes(term);
    });
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

  // ---- Render
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Premium Dashboard (Infinite Scroll)</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search series_id or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
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

      {/* INFINITE SCROLL SENTINEL */}
      <div ref={sentinelRef} className="h-10 w-full" />

      {loadingMore && <div className="text-center mt-2">Loading more...</div>}
    </div>
  );
}