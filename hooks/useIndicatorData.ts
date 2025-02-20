// FILE: hooks/useIndicatorData.ts
"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface FredRow {
  date: string;
  value: number | null;
  economic_indicators?: {
    description?: string;
  };
}

/**
 * Fetch rows from "fred_data"
 */
async function fetchIndicatorData(seriesId: string): Promise<FredRow[]> {
  const { data, error } = await supabase
    .from("fred_data")
    .select(`
      series_id,
      date,
      value,
      economic_indicators!inner (
        description
      )
    `)
    .eq("series_id", seriesId)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  // If we trust the shape, cast to FredRow[]
  return (data as FredRow[]) || [];
}

/**
 * useIndicatorData - typed so data is FredRow[] | undefined
 */
export function useIndicatorData(seriesId: string): UseQueryResult<FredRow[], Error> {
  return useQuery<FredRow[], Error>(["indicatorData", seriesId], () =>
    fetchIndicatorData(seriesId)
  );
}