import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { alertApi } from "@/services/api/alertApi";
import { geofenceApi } from "@/services/api/geofenceApi";
import { vehicleApi } from "@/services/api/vehicleApi";
import { EventType } from "@/types/alert";

const alertSchema = z.object({
  geofence_id: z.string().min(1, "Please choose a geofence"),
  vehicle_id: z.string().optional(),
  event_type: z.string().min(1, "Please select an event trigger"),
});

type AlertFormValues = z.infer<typeof alertSchema>;

interface ConfigureAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigureAlertModal({ isOpen, onClose }: ConfigureAlertModalProps) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Geofences
  const { data: geofencesData } = useQuery({
    queryKey: ["geofences"],
    queryFn: geofenceApi.list,
  });

  // Fetch Vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.list,
  });

  const geofences = geofencesData?.geofences || [];
  const vehicles = vehiclesData?.vehicles || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertFormValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      geofence_id: "",
      vehicle_id: "",
      event_type: "entry",
    },
  });

  const mutation = useMutation({
    mutationFn: alertApi.configure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      reset();
      setFormError(null);
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to configure alert rule");
    },
  });

  const onSubmit = (data: AlertFormValues) => {
    setFormError(null);
    mutation.mutate({
      geofence_id: data.geofence_id,
      vehicle_id: data.vehicle_id ? data.vehicle_id : undefined,
      event_type: data.event_type as EventType,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Geofence Alert Rule"
      description="Define boundary breach triggers and notifications."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Geofence *
          </label>
          <Select {...register("geofence_id")} error={errors.geofence_id?.message}>
            <option value="">Select a boundary...</option>
            {geofences.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.category})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Vehicle (Optional)
          </label>
          <Select {...register("vehicle_id")}>
            <option value="">All Vehicles (Global Rule)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number} — {v.driver_name}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[11px] text-slate-500">
            Leaving this blank will trigger alerts whenever any vehicle crosses the perimeter.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Event Trigger Type *
          </label>
          <Select {...register("event_type")} error={errors.event_type?.message}>
            <option value="entry">Entry Only (When vehicle enters boundary)</option>
            <option value="exit">Exit Only (When vehicle leaves boundary)</option>
            <option value="both">Both (Entry &amp; Exit)</option>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending} className="gap-1.5">
            <Check className="h-4 w-4" /> Save Alert Rule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
