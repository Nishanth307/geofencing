import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { vehicleApi } from "@/services/api/vehicleApi";
import { VehicleType } from "@/types/vehicle";

const vehicleSchema = z.object({
  vehicle_number: z
    .string()
    .min(3, "Vehicle registration number must be at least 3 characters")
    .regex(/^[A-Za-z0-9\s-]+$/, "Alphanumeric, space, and hyphens only"),
  driver_name: z.string().min(2, "Driver name must be at least 2 characters"),
  vehicle_type: z.string().min(1, "Please choose a vehicle type"),
  phone: z
    .string()
    .min(6, "Phone number is too short")
    .regex(/^[0-9+\s()-]+$/, "Invalid phone number format"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterVehicleModal({ isOpen, onClose }: RegisterVehicleModalProps) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicle_number: "",
      driver_name: "",
      vehicle_type: "Truck",
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: vehicleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      reset();
      setFormError(null);
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to register vehicle. It may already exist.");
    },
  });

  const onSubmit = (data: VehicleFormValues) => {
    setFormError(null);
    mutation.mutate({
      vehicle_number: data.vehicle_number.trim().toUpperCase(),
      driver_name: data.driver_name.trim(),
      vehicle_type: data.vehicle_type as VehicleType,
      phone: data.phone.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Vehicle"
      description="Add a commercial asset to your fleet tracking system."
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
            Vehicle License Plate / Number *
          </label>
          <Input
            placeholder="e.g. KA-01-AB-1234"
            className="uppercase font-mono"
            {...register("vehicle_number")}
            error={errors.vehicle_number?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Driver Name *
          </label>
          <Input
            placeholder="e.g. Rajesh Sharma"
            {...register("driver_name")}
            error={errors.driver_name?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Vehicle Type *
          </label>
          <Select {...register("vehicle_type")} error={errors.vehicle_type?.message}>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Car">Car</option>
            <option value="Motorcycle">Motorcycle</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Driver Contact Phone *
          </label>
          <Input
            placeholder="e.g. +91 98765 43210"
            type="tel"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending} className="gap-1.5">
            <Check className="h-4 w-4" /> Register Vehicle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
