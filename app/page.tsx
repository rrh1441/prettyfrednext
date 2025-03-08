/**
 * FILE: app/page.tsx
 * This is the server component “shell.”
 * We export const dynamic = "force-dynamic" to skip pre-rendering,
 * and then render the “client” file for all your logic.
 */
export const dynamic = "force-dynamic";

import HomeClient from "./HomeClient";

export default function Page() {
  // Nothing else fancy here. Just return the client component.
  return <HomeClient />;
}