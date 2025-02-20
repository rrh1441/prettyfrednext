"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * We define individual subcomponents:
 * Slider.Root, Slider.Track, Slider.Range, Slider.Thumb
 * Then re-export them together as 'Slider'.
 */

const Root = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  />
));
Root.displayName = "SliderRoot";

const Track = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Track>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Track>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Track
    ref={ref}
    className={cn("relative grow rounded-full bg-muted", className)}
    {...props}
  />
));
Track.displayName = "SliderTrack";

const Range = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Range>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Range>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Range
    ref={ref}
    className={cn("absolute h-full rounded-full bg-primary", className)}
    {...props}
  />
));
Range.displayName = "SliderRange";

const Thumb = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Thumb
    ref={ref}
    className={cn("block h-4 w-4 rounded-full border-2 border-primary bg-white", className)}
    {...props}
  />
));
Thumb.displayName = "SliderThumb";

// Re-export them under a single object, so in your code you can do <Slider.Root> <Slider.Track> ...
export const Slider = {
  Root,
  Track,
  Range,
  Thumb,
};