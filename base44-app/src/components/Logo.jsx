import React from "react";
import { LOGO_URL } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function Logo({ size = 64, className, rounded = "rounded-2xl" }) {
  return (
    <div
      className={cn("relative overflow-hidden bg-[#1A1A1A] ring-1 ring-white/10", rounded, className)}
      style={{ width: size, height: size }}
    >
      <img src={LOGO_URL} alt="OTC — Off Trail Challenge" className="w-full h-full object-cover" />
    </div>
  );
}