
import React from "react";
import { cn } from "@/lib/utils";

interface BlurContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "heavy";
  className?: string;
  children: React.ReactNode;
}

export function BlurContainer({
  intensity = "medium",
  className,
  children,
  ...props
}: BlurContainerProps) {
  const blurIntensity = {
    light: "backdrop-blur-sm bg-white/40 dark:bg-black/40",
    medium: "backdrop-blur-md bg-white/60 dark:bg-black/60",
    heavy: "backdrop-blur-lg bg-white/80 dark:bg-black/80",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/20 dark:border-white/10 shadow-sm",
        blurIntensity[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
