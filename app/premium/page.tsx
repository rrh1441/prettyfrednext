import { supabase } from "@/lib/supabaseClient";
import MembersClient from "./MembersClient";

/**
 * Hardcode your 100+ FRED series in exact order:
 */
const FULL_SERIES_LIST = [
  // [1..10] (initial SSR)
  { series_id: "GDP", description: "Gross Domestic Product (Nominal)" },
  { series_id: "GDPC1", description: "Real GDP (Chained 2012 Dollars)" },
  { series_id: "UNRATE", description: "Civilian Unemployment Rate" },
  { series_id: "CPIAUCSL", description: "CPI for All Urban Consumers" },
  { series_id: "PAYEMS", description: "Total Nonfarm Payrolls" },
  { series_id: "FEDFUNDS", description: "Effective Federal Funds Rate" },
  { series_id: "DGS10", description: "10-Year Treasury Constant Maturity" },
  { series_id: "SP500", description: "S&P 500 Index" },
  { series_id: "M2SL", description: "M2 Money Stock" },
  { series_id: "PCEC", description: "Personal Consumption Expenditures" },
  // [11..100+] (remaining to be lazy loaded)
  { series_id: "DSPIC96", description: "Real Disposable Personal Income" },
  { series_id: "HOUST", description: "Housing Starts" },
  { series_id: "RSAFS", description: "Retail Sales" },
  // ... [snip the rest for brevity, but keep them in your actual file]
];

/** Data shape for your chart. */
export interface SeriesData {
  series_id: string;
  description: string;
  data: { date: string; value: number | null }[];
}

interface FredRow {
  date: string;
  value: number | null;
}

export default async function PremiumPage() {
  // 1) Separate first 10 vs the rest
  const first10 = FULL_SERIES_LIST.slice(0, 10);
  const rest = FULL_SERIES_LIST.slice(10);

  const initialSeries: SeriesData[] = [];

  // 2) Fetch row data for the first 10 (SSR)
  for (const item of first10) {
    const { data: rows, error } = await supabase
      .from("fred_data")
      .select("date, value")
      .eq("series_id", item.series_id)
      .order("date", { ascending: true });

    if (error) {
      console.error(`Error fetching ${item.series_id}`, error.message);
      continue;
    }

    const dataArr = (rows ?? []).map((r: FredRow) => ({
      date: r.date,
      value: r.value,
    }));

    initialSeries.push({
      series_id: item.series_id,
      description: item.description,
      data: dataArr,
    });
  }

  // 3) Pass the SSR data + metadata for the remaining
  return (
    <MembersClient
      initialSeries={initialSeries} // 1st chunk fully loaded
      remainingSeriesMetadata={rest} // rest for infinite scrolling
    />
  );
}