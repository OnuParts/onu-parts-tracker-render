import React, { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PolarBearWavingIcon } from "./polar-bear-icon";
import { HelpCircle } from "lucide-react";

interface BearTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

export function BearTooltip({
  children,
  content,
  side = "top",
  align = "center",
  className,
}: BearTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={() => setOpen(true)}>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className={cn("relative bear-tooltip-content p-4 max-w-xs", className)}
        >
          <div className="flex items-start gap-3">
            <div className="bear-avatar flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center overflow-hidden">
              <PolarBearWavingIcon />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium mb-1">ONU Polar Bear Helper</p>
              <div>{content}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function HelpIcon({ className }: { className?: string }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors cursor-help",
        className
      )}
    >
      <HelpCircle className="w-4 h-4" />
    </span>
  );
}