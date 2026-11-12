import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-slate-200 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Spinner size="lg" className="mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = "No data found",
  description = "No items match your criteria.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-400 mb-3">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Failed to load data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-8 text-center">
      <div className="rounded-full bg-red-100 p-3 text-red-600 mb-3">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">Communication Error</h3>
      <p className="mt-1 text-xs text-slate-600 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm border border-slate-300 hover:bg-slate-50"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

