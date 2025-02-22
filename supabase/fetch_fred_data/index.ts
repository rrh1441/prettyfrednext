import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Helper to add one day to a YYYY-MM-DD string.
 */
function addOneDay(dateStr: string): string {
  const d = new Date(dateStr);
  // Increase date by 1
  d.setDate(d.getDate() + 1);
  // Convert back to "YYYY-MM-DD"
  return d.toISOString().split("T")[0];
}

serve(async () => {
  const SUPABASE_URL = Deno.env.get("URL")!;
  const SUPABASE_SERVICE_ROLE = Deno.env.get("SERVICE_ROLE")!;
  const FRED_API_KEY = Deno.env.get("FRED_API_KEY")!;

  // Create a Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  try {
    // 1) Grab all indicators
    const { data: indicators, error: indicatorsErr } = await supabase
      .from("economic_indicators")
      .select("series_id");

    if (indicatorsErr) {
      throw new Error(`Failed to fetch indicators: ${indicatorsErr.message}`);
    }
    if (!indicators || indicators.length === 0) {
      return new Response("No economic_indicators found.", { status: 200 });
    }

    console.log(`Found ${indicators.length} indicators. Processing 1 at a time, with 10s delay each.`);

    // 2) Process in single-series chunks
    const chunkSize = 1;             // <--- changed to 1
    const chunkDelayMs = 10_000;     // <--- 10-second delay

    for (let i = 0; i < indicators.length; i += chunkSize) {
      // Pull exactly 1 indicator
      const chunk = indicators.slice(i, i + chunkSize);

      for (const { series_id } of chunk) {
        console.log(`Checking new data for series_id: ${series_id}`);

        // 2a) Find the most recent date we have for this series
        const { data: latestRows, error: latestErr } = await supabase
          .from("fred_data")
          .select("date")
          .eq("series_id", series_id)
          .order("date", { ascending: false })
          .limit(1);

        if (latestErr) {
          console.error(`Error getting latest date for ${series_id}: ${latestErr.message}`);
          continue;
        }

        // By default, if we have no rows, let's start from "1900-01-01"
        let observationStart = "1900-01-01";

        if (latestRows && latestRows.length > 0) {
          const lastDate = latestRows[0].date; // e.g. "2023-12-31"
          observationStart = addOneDay(lastDate); // e.g. "2024-01-01"
        }

        console.log(`Fetching new observations for ${series_id} since ${observationStart}`);

        // 2b) Fetch from FRED
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&observation_start=${observationStart}&api_key=${FRED_API_KEY}&file_type=json`;
        const resp = await fetch(fredUrl);
        const result = await resp.json();

        if (!result.observations) {
          console.log(`No new observations for ${series_id}.`);
          continue;
        }

        // 2c) Upsert new observations
        const observations = result.observations.map((obs: any) => ({
          series_id,
          date: obs.date,
          value: obs.value ? parseFloat(obs.value) : null,
        }));

        if (observations.length === 0) {
          console.log(`No new rows to upsert for ${series_id}.`);
          continue;
        }

        const { error: upsertErr } = await supabase
          .from("fred_data")
          .upsert(observations, { onConflict: ["series_id", "date"] });

        if (upsertErr) {
          console.error(`Error inserting new data for ${series_id}: ${upsertErr.message}`);
        } else {
          console.log(`Upserted ${observations.length} new rows for ${series_id}`);
        }
      }

      console.log(`Finished chunk [${i}..${i + chunk.length - 1}] of ${indicators.length} total. Pausing ${chunkDelayMs/1000}s...`);

      // Pause 10 seconds before the next indicator, if any
      if (i + chunkSize < indicators.length) {
        await new Promise((resolve) => setTimeout(resolve, chunkDelayMs));
      }
    }

    return new Response("Done fetching big historical data, 1 series at a time!", {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});