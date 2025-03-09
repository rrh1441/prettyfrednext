"use client";

import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="shadow-lg bg-white rounded p-8 space-y-6">
          <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          <p>
            <strong>Effective Date:</strong> March 1, 2025
          </p>
          <p>
            Simple Apps, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
            protecting your privacy. This Privacy Policy outlines how we collect, use,
            and safeguard your information when you use our applications (&quot;the App&quot;).
            By using the App, you agree to the terms of this Privacy Policy.
          </p>

          <ol className="list-decimal list-outside ml-6 space-y-4">
            <li>
              <strong>Information We Collect</strong>
              <ul className="list-disc list-outside ml-6 space-y-2">
                <li>
                  Personal Information: Name, email address, and payment information
                  (processed securely through Stripe).
                </li>
                <li>
                  Usage Data: Information about how you interact with the App, such as
                  court preferences and search history.
                </li>
                <li>
                  Device Information: Information about the device you use to access the
                  App, including device type, operating system, and IP address.
                </li>
              </ul>
            </li>

            <li>
              <strong>How We Use Your Information</strong>
              <ul className="list-disc list-outside ml-6 space-y-2">
                <li>Provide and improve the App&apos;s functionality.</li>
                <li>Facilitate bookings and manage your account.</li>
                <li>Communicate with you about updates, promotions, or support inquiries.</li>
                <li>Analyze usage trends to improve the user experience.</li>
              </ul>
            </li>

            <li>
              <strong>Data Sharing</strong>
              <p className="mt-2">
                We do not sell, rent, or share your personal information with third
                parties for their marketing purposes. However, we may share data with:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-2">
                <li>Service Providers: For payment processing (e.g., Stripe) or analytics.</li>
                <li>Legal Authorities: When required by law or to protect our legal rights.</li>
              </ul>
            </li>

            <li>
              <strong>Data Security</strong>
              <p className="mt-2">
                We implement reasonable measures to protect your information from
                unauthorized access, disclosure, or destruction. However, no security
                measures are completely secure, and we cannot guarantee absolute security.
              </p>
            </li>

            <li>
              <strong>Your Rights</strong>
              <ul className="list-disc list-outside ml-6 space-y-2">
                <li>Access, update, or delete your personal information by contacting us.</li>
                <li>Opt out of promotional communications.</li>
              </ul>
            </li>

            <li>
              <strong>Third-Party Links</strong>
              <p className="mt-2">
                The App may contain links to third-party websites or services. We are not
                responsible for the privacy practices of these external sites.
              </p>
            </li>

            <li>
              <strong>Changes to This Privacy Policy</strong>
              <p className="mt-2">
                We may update this Privacy Policy from time to time. Changes will be posted
                on this page with an updated effective date.
              </p>
            </li>

            <li>
              <strong>Contact Us</strong>
              <p className="mt-2">
                If you have questions or concerns about this Privacy Policy, please contact us at:
              </p>
              <p className="space-y-1">
                Email:{" "}
                <a href="mailto:support@simpleappsgroup.com" className="text-blue-600 hover:underline">
                  support@simpleappsgroup.com
                </a>
                <br />
                Address: Simple Apps, LLC, 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801
              </p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}