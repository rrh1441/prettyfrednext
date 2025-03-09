/* FILE: app/pro/page.tsx */

import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import MembersClient from "./MembersClient";

/**
 * If you’re only using the data in your client component,
 * you can remove references to `initialSeries` & `remainingSeriesMetadata`.
 * Instead, just define the array of "allSeriesList" below (like you had)
 * and pass that to <MembersClient />.
 */

// Example full series list from your existing code
const FULL_SERIES_LIST = [
  { series_id: "A191RL1A225NBEA", description: "Real Personal Consumption Expenditures" },
  { series_id: "AHETPI", description: "\"Average Hourly Earnings: Total Private, All Employees\"" },
  { series_id: "AWHMAN", description: "Average Weekly Hours of Manufacturing Employees: Total Private" },
  // ... (rest of your series)
];

export default async function ProPage() {
  // If you had server-side fetching or logic, you can keep it here,
  // but do not pass unused props to <MembersClient> anymore.

  // e.g., if you have logic to load data from supabase, you can do it here,
  // but currently your MembersClient does its own fetching inside a useEffect.
  // So you can simply return:

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Centered Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/prettyfred-logo.png"
              alt="PrettyFRED Logo"
              width={600}
              height={300}
              priority
            />
          </div>
        </div>

        {/* Only pass allSeriesList, which matches MembersClientProps */}
        <MembersClient allSeriesList={FULL_SERIES_LIST} />
      </div>
    </div>
  );
}