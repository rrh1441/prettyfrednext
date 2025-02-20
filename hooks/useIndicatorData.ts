"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

interface FredRow {
  date: string;
  value: number | null;
  economic_indicators?: {
    description?: string;
  };
}

async function fetchIndicatorData(seriesId: string): Promise<FredRow[]> {
  const { data, error } = await supabase
    .from("fred_data")
    .select(
      `
        series_id,
        date,
        value,
        economic_indicators!inner(
          description
        )
      `
    )
    .eq("series_id", seriesId)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  // data might be FredRow[] or null
  return (data as FredRow[]) || [];
}

export function useIndicatorData(seriesId: string) {
  return useQuery(["indicatorData", seriesId], () => fetchIndicatorData(seriesId));
}