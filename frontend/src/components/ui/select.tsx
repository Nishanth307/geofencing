import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

