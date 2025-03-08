/* FILE: app/components/ui/SubscriptionCard.tsx */
"use client";

import React from "react";
import Card from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  onSubscribe?: () => void;
}

export default function SubscriptionCard({ onSubscribe }: SubscriptionCardProps) {
  return (
    <Card className={cn("p-6 w-full max-w-xl mx-auto")}>
      <h2 className="text-3xl font-bold mb-6 text-center">
        Beautiful Visualizations of FRED Data
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Basic Section */}
        <div className="p-4 border rounded">
          <h3 className="text-xl font-semibold mb-2">
            Basic <span className="text-sm font-normal">(Free)</span>
          </h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Access to key economic indicators</li>
            <li>Demo customization with GDP chart</li>
            <li>Realtime data updates</li>
          </ul>
        </div>

        {/* Pro Section */}
        <div className="p-4 border rounded">
          <h3 className="text-xl font-semibold mb-2">Pro</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Completely customize your charts</li>
            <li>Access to 80+ data series with realtime updates</li>
            <li>Export data in multiple formats</li>
            <li>Request any FRED data series</li>
          </ul>
        </div>
      </div>

      <button
        // If a parent passes onSubscribe, call it; otherwise log a message
        onClick={onSubscribe ? onSubscribe : () => console.log("Unlock Pro clicked")}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition"
      >
        Unlock Pro
      </button>

      {/* Coming Soon */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="text-lg font-semibold mb-2">Coming Soon to Pro</h4>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Regression Analysis</li>
          <li>Custom Transformations</li>
          <li>Comparisons across multiple series</li>
        </ul>
      </div>
    </Card>
  );
}