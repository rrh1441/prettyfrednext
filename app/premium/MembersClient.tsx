"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback
} from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabaseClient";
import EconomicChart from "@/components/EconomicChart";
import Card from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SeriesData } from "./page";

/** Metadata for leftover items we haven't fetched row data for yet. */
interface SeriesMeta {
  series_id: string;
  description: string;
}

/** Row type from 'fred_data'. */
interface FredRow {
  date: string;
  value: number | null;
}

interface MembersClientProps {
  /** The first 10 series (fully loaded) from SSR. */
  initialSeries: SeriesData[];
  /** The rest 90+ series, only metadata. We lazy-load row data. */
  remainingSeriesMetadata: SeriesMeta[];
}

export default function MembersClient({
  initialSeries,
  remainingSeriesMetadata,
}: MembersClientProps) {
  // 1) State: loaded series (row data), pinned, search, leftover
  const [loadedSeries, setLoadedSeries] = useState<SeriesData[]>(initialSeries);
  const [unused, setUnused] = useState<SeriesMeta[]>(remainingSeriesMetadata);
  const [pinnedIDs, setPinnedIDs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 2) Chart refs for exporting
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 3) Infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  /** 
   * Helper: fetch row data for a given list of series metadata.
   * Returns an array of SeriesData.
   */
  const fetchSeriesRows = useCallback(async (metas: SeriesMeta[]): Promise<SeriesData[]> => {
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

      // Use FredRow type instead of any
      const chartData = (rows as FredRow[] ?? []).map((r) => ({
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

  /**
   * loadNextChunk: fetch the next 10 from 'unused' (if available)
   * and append them to loadedSeries.
   */
  const loadNextChunk = useCallback(async () => {
    if (loadingMore || unused.length === 0) return;
    setLoadingMore(true);

    // Grab next 10 metadata
    const chunk = unused.slice(0, 10);
    const newData = await fetchSeriesRows(chunk);

    setLoadedSeries((prev) => [...prev, ...newData]);
    setUnused((prev) => prev.slice(10));
    setLoadingMore(false);
  }, [loadingMore, unused, fetchSeriesRows]);

  // 4) Intersection Observer effect for infinite scrolling
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          // We reached the sentinel => load next chunk
          loadNextChunk();
        }
      },
      { threshold: 1.0 } // fully in view
    );

    observer.observe(node);

    // Cleanup
    return () => {
      observer.unobserve(node);
    };
  }, [loadNextChunk]); // depends on stable callback

  // 5) Search logic. On click, fetch from supabase -> add to loadedSeries
  async function handleSearch() {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return;

    const { data: found, error } = await supabase
      .from("economic_indicators")
      .select("series_id, description")
      .ilike("series_id", `%${term}%`)
      .limit(20);

    if (error || !found) {
      console.warn("Search error:", error?.message);
      return;
    }

    // Filter out ones we already have
    const toFetch: SeriesMeta[] = [];
    for (const f of found) {
      if (!loadedSeries.some((ls) => ls.series_id === f.series_id)) {
        toFetch.push({ series_id: f.series_id, description: f.description });
      }
    }

    if (toFetch.length > 0) {
      const newlyFetched = await fetchSeriesRows(toFetch);
      setLoadedSeries((prev) => [...prev, ...newlyFetched]);
      // remove any from 'unused'
      setUnused((prev) =>
        prev.filter((u) => !toFetch.some((tf) => tf.series_id === u.series_id))
      );
    }
  }

  // 6) Pin logic
  function togglePin(seriesId: string) {
    setPinnedIDs((prev) =>
      prev.includes(seriesId) ? prev.filter((id) => id !== seriesId) : [...prev, seriesId]
    );
  }

  // 7) Filter and order pinned vs unpinned
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

  // 8) Export logic (PNG/JPG/CSV)
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

  // 9) Render
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Premium Dashboard (Infinite Scroll)</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by series_id or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* PINNED CHARTS */}
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

      {/* UNPINNED CHARTS */}
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

      {/* Our invisible "sentinel" div for infinite scroll */}
      <div ref={sentinelRef} className="h-10 w-full" />

      {/* Optional loading indicator */}
      {loadingMore && <div className="text-center mt-2">Loading more...</div>}
    </div>
  );
}