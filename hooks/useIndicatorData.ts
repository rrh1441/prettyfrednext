"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

/** A single row from the "fred_data" table. */
export interface FredRow {
  date: string;
  value: number | null;
  economic_indicators?: {
    description?: string;
  };
}

/** 
 * Fetch an array of FredRow from "fred_data". 
 * If none found, returns empty array.
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

  if (error) {
    throw new Error(error.message);
  }
  return (data as FredRow[]) || [];
}

/**
 * useIndicatorData:
 * - React Query to fetch "fred_data" for a given series_id
 * - Returns UseQueryResult<FredRow[], Error>, so 'query.data' is FredRow[] | undefined
 */
export function useIndicatorData(seriesId: string): UseQueryResult<FredRow[], Error> {
  /**
   * We pass four generics to useQuery:
   *   <TQueryFnData, TError, TData, TQueryKey>
   * but typically we only need:
   *   <TQueryFnData, TError> 
   *
   * TQueryFnData = FredRow[]
   * TError = Error
   */
  return useQuery<FredRow[], Error>({
    queryKey: ["indicatorData", seriesId],
    queryFn: () => fetchIndicatorData(seriesId),
  });
}