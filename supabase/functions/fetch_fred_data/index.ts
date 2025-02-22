import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Helper to add one day to a YYYY-MM-DD string.
 */
function addOneDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

serve(async () => {
  const SUPABASE_URL = Deno.env.get("URL")!;
  const SUPABASE_SERVICE_ROLE = Deno.env.get("SERVICE_ROLE")!;
  const FRED_API_KEY = Deno.env.get("FRED_API_KEY")!;
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

    // 2) Load offset from function_state table
    let currentOffset = 0;
    {
      const { data: stateRow, error: stateErr } = await supabase
        .from("function_state")
        .select("current_offset")
        .eq("id", 1)
        .single();

      if (stateErr) {
        console.error("Error reading function_state:", stateErr.message);
      } else if (stateRow) {
        currentOffset = stateRow.current_offset || 0;
        console.log(`Read current_offset from function_state: ${currentOffset}`);
      } else {
        console.log("No state row found in function_state, default offset=0");
      }
    }

    console.log(
      `Found ${indicators.length} indicators. Starting at offset=${currentOffset}, chunkSize=1, 2s delay.`
    );

    const chunkSize = 1;
    const chunkDelayMs = 2_000;

    // 3) Start from currentOffset
    for (let i = currentOffset; i < indicators.length; i += chunkSize) {
      const chunk = indicators.slice(i, i + chunkSize);

      for (const { series_id } of chunk) {
        console.log(`(i=${i}) Checking new data for series_id: ${series_id}`);

        // 3a) Find most recent date in fred_data
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

        let observationStart = "1900-01-01";
        if (latestRows && latestRows.length > 0) {
          observationStart = addOneDay(latestRows[0].date);
        }

        console.log(`Fetching new observations for ${series_id} since ${observationStart}`);

        // 3b) Fetch from FRED
        const fredUrl =
          `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&observation_start=${observationStart}&api_key=${FRED_API_KEY}&file_type=json`;
        const resp = await fetch(fredUrl);
        const result = await resp.json();

        if (!result.observations) {
          console.log(`No new observations for ${series_id}.`);
          continue;
        }

        // 3c) Upsert
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
          console.error(`Error inserting data for ${series_id}: ${upsertErr.message}`);
        } else {
          console.log(`Upserted ${observations.length} rows for ${series_id}`);
        }
      }

      // Save offset **immediately** after each single-series chunk
      const newOffset = i + chunkSize;
      const { error: offsetErr } = await supabase
        .from("function_state")
        .update({ current_offset: newOffset })
        .eq("id", 1);

      if (offsetErr) {
        console.error("Error saving offset to function_state:", offsetErr.message);
      } else {
        console.log(`Updated current_offset to ${newOffset}`);
      }

      console.log(`Finished i=${i}. Pausing ${chunkDelayMs / 1000}s...`);
      if (newOffset < indicators.length) {
        await new Promise((resolve) => setTimeout(resolve, chunkDelayMs));
      }
    }

    return new Response("Done fetching big historical data with immediate offset update!", {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});