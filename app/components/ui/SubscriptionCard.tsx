"use client";

import React from "react";
import Card from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  onUnlockPremium?: () => void;
}

export default function SubscriptionCard({ onUnlockPremium }: SubscriptionCardProps) {
  return (
    <Card className={cn("p-6 w-full h-full")}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Get Beautiful Visualizations of FRED Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Section */}
            <div>
              <h3 className="text-xl font-semibold mb-3">
                Basic <span className="text-sm font-normal">(Free)</span>
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Access to key economic indicators</li>
                <li>Basic visualization options</li>
                <li>Monthly data updates</li>
              </ul>
            </div>
            {/* Premium Section */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Premium</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Completely customize your charts</li>
                <li>Export data in multiple formats</li>
                <li>Request any FRED data series</li>
              </ul>
            </div>
          </div>
        </div>
        {/* CTA Button */}
        <div className="mt-8">
          <button
            onClick={onUnlockPremium ? onUnlockPremium : () => console.log("Unlock Premium clicked")}
            className="w-full bg-primary text-white font-semibold py-3 px-6 rounded hover:bg-primary-dark transition"
          >
            Unlock Premium
          </button>
        </div>
      </div>
    </Card>
  );
}
