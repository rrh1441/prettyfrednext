// FILE: hooks/useIndicatorData.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface FredRow {
  date: string;
  value: number | null;
  economic_indicators?: {
    description?: string;
  };
}

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
  // Type assertion to FredRow[] is fine if we trust our DB schema
  return (data as FredRow[]) || [];
}

export function useIndicatorData(seriesId: string) {
  // specify <FredRow[]> to ensure 'query.data' is typed as FredRow[] | undefined
  return useQuery<FredRow[]>(["indicatorData", seriesId], () =>
    fetchIndicatorData(seriesId)
  );
}