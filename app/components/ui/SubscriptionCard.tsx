"use client";

import React from "react";
import Card from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  onSubscribe?: () => void;
}

export default function SubscriptionCard({ onSubscribe }: SubscriptionCardProps) {
  return (
    <Card className={cn("p-8 w-full h-full flex flex-col")}>
      <div className="flex-grow">
        <h2 className="text-3xl font-bold mb-6 text-center">Upgrade to Premium</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic (Free) Section */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Basic <span className="text-sm font-normal">(Free)</span>
            </h3>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Access to key economic indicators</li>
              <li>Basic visualizations</li>
            </ul>
          </div>
          {/* Premium Section */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Premium</h3>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Customize all the graphs</li>
              <li>100+ data series available</li>
              <li>Request additional data series</li>
              <li>Export graphs as images or csv files</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button
          onClick={onSubscribe ? onSubscribe : () => console.log("Unlock Premium clicked")}
          className="w-full md:w-auto bg-primary text-white font-semibold py-3 px-6 rounded hover:bg-primary-dark transition"
        >
          Unlock Premium
        </button>
      </div>
    </Card>
  );
}