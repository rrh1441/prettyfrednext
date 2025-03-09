/** 
 * FILE: app/page.tsx
 * This is the server component “shell.”
 * We export const dynamic = "force-dynamic" to skip pre-rendering,
 * then render the “client” file for all your logic.
 */
export const dynamic = "force-dynamic";

import HomeClient from "./HomeClient";

export default function Page() {
  return (
    <>
      {/* The main home content */}
      <HomeClient />

      {/* Footer links with bottom spacing */}
      <footer className="mt-8 mb-8 flex justify-center space-x-6">
        <a href="/privacy-policy" className="underline">
          Privacy Policy
        </a>
        <a href="/terms-of-service" className="underline">
          Terms of Service
        </a>
        <a
          href="https://billing.stripe.com/p/login/bIYcNjb9M6id5Og7ss"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Manage Subscription
        </a>
      </footer>
    </>
  );
}