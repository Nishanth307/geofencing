import * as React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Spinner } from "./spinner";

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  resourceName?: string;
  description: React.ReactNode;
  consequences?: string;
  details?: React.ReactNode;
  confirmText?: string;
  isPending?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  resourceName,
  description,
  consequences,
  details,
  confirmText = "Delete",
  isPending = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) onClose();
      }}
      title={title}
      maxWidth="md"
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        {/* Warning Callout */}
        <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/70 p-3 text-red-900">
          <div className="mt-0.5 rounded-full bg-red-100 p-1 text-red-600 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold">
              {resourceName ? (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-bold underline text-red-950 font-mono">
                    {resourceName}
                  </span>
                  ?
                </>
              ) : (
                "Are you sure you want to proceed?"
              )}
            </p>
            <div className="text-red-700/90 leading-relaxed">{description}</div>
          </div>
        </div>

        {/* Optional Custom Details Box */}
        {details && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1.5 font-mono">
            {details}
          </div>
        )}

        {/* Consequences notice */}
        {consequences && (
          <p className="text-[11px] text-slate-500 italic">
            {consequences}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={isPending}
            className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
              <>
                <Spinner size="sm" className="h-3.5 w-3.5 text-white" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> {confirmText}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
