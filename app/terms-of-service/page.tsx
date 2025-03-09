"use client";

import React from "react";

// Helper component for section formatting
interface TermsSectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

const TermsSection: React.FC<TermsSectionProps> = ({ number, title, children }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-slate-800">
        {number}. {title}
      </h2>
      <div className="text-slate-700 pl-1">{children}</div>
    </div>
  );
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Replace the custom Card with a plain <div> */}
        <div className="shadow-lg bg-white rounded">
          {/* Card content area */}
          <div className="p-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
                <p className="text-slate-500">
                  <strong>Effective Date:</strong> March 1, 2025
                </p>
                <hr className="my-4" />
              </div>

              <div className="text-slate-700 leading-relaxed">
                <p>
                  These Terms of Service (&quot;Terms&quot;) govern your use of the Simple Apps Group applications
                  (&quot;the App&quot;), owned and operated by Simple Apps, LLC (&quot;we,&quot; &quot;our,&quot; or
                  &quot;us&quot;). By accessing or using the App, you agree to these Terms. If you do not agree, please
                  refrain from using the App.
                </p>
              </div>

              <div className="space-y-6">
                <TermsSection number={1} title="Account Registration">
                  <ul className="list-disc list-outside ml-6 space-y-2">
                    <li>You must provide accurate and complete information during registration.</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                  </ul>
                </TermsSection>

                <TermsSection number={2} title="Use of the App">
                  <ul className="list-disc list-outside ml-6 space-y-2">
                    <li>You may use the App only for lawful purposes.</li>
                    <li>
                      You agree not to engage in any activity that disrupts or interferes with the App&apos;s
                      functionality.
                    </li>
                  </ul>
                </TermsSection>

                <TermsSection number={3} title="Payments and Subscriptions">
                  <ul className="list-disc list-outside ml-6 space-y-2">
                    <li>Payments are processed securely via Stripe.</li>
                    <li>Subscriptions renew automatically unless canceled.</li>
                    <li>
                      <strong>No Refunds:</strong> All payments are final. However, you may cancel your subscription at
                      any time via Stripe to avoid future charges.
                    </li>
                  </ul>
                </TermsSection>

                <TermsSection number={4} title="Intellectual Property">
                  <p>
                    All content, features, and functionality of the App are owned by Simple Apps, LLC and protected by
                    intellectual property laws.
                  </p>
                </TermsSection>

                <TermsSection number={5} title="Limitation of Liability">
                  <p>
                    The App is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
                    damages resulting from your use of the App, to the fullest extent permitted by law.
                  </p>
                </TermsSection>

                <TermsSection number={6} title="Termination">
                  <ul className="list-disc list-outside ml-6 space-y-2">
                    <li>We may suspend or terminate your account if you violate these Terms.</li>
                    <li>You may cancel your account at any time through the App or by contacting support.</li>
                  </ul>
                </TermsSection>

                <TermsSection number={7} title="Changes to These Terms">
                  <p>
                    We may update these Terms from time to time. Changes will be posted on this page with an updated
                    effective date.
                  </p>
                </TermsSection>

                <TermsSection number={8} title="Governing Law">
                  <p>
                    These Terms are governed by the laws of the State of Wyoming, without regard to its conflict of laws
                    principles.
                  </p>
                </TermsSection>

                <TermsSection number={9} title="Contact Us">
                  <p className="mb-3">If you have questions or concerns about these Terms, please contact us at:</p>
                  <p className="space-y-1">
                    Email:{" "}
                    <a href="mailto:support@simpleappsgroup.com" className="text-blue-600 hover:underline">
                      support@simpleappsgroup.com
                    </a>
                    <br />
                    Address: Simple Apps, LLC, 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801
                  </p>
                </TermsSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}