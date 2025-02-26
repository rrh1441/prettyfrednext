"use client";

import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";

import { LoginForm } from "@/components/login-form";

/**
 * Our LoginPage uses a two-column layout (left is the form, right is an image).
 * The left side has a logo or brand link up top, then the LoginForm in the center.
 */
export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left column */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Possibly your brand or top link */}
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>

        {/* Center the login form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right column: background image, hidden on smaller screens */}
      <div className="relative hidden bg-muted lg:block">
        {/* Use next/image or <img> as you prefer */}
        <Image
          src="/placeholder.svg"
          alt="Background Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}