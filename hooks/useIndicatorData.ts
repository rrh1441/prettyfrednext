// FILE: hooks/useIndicatorData.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

async function fetchIndicatorData(seriesId: string) {
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
  return data ?? [];
}

export function useIndicatorData(seriesId: string) {
  return useQuery(["indicatorData", seriesId], () => fetchIndicatorData(seriesId));
}