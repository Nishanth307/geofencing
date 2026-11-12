import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Plus, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LeafletMap } from "@/components/maps/LeafletMap";
import { geofenceApi } from "@/services/api/geofenceApi";
import { GeofenceCategory } from "@/types/geofence";

const geofenceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category"),
});

type GeofenceFormValues = z.infer<typeof geofenceSchema>;

interface CreateGeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGeofenceModal({ isOpen, onClose }: CreateGeofenceModalProps) {
  const queryClient = useQueryClient();
  const [points, setPoints] = useState<[number, number][]>([
    [12.975, 77.59],
    [12.975, 77.60],
    [12.965, 77.60],
    [12.965, 77.59],
  ]);
  const [pointInputLat, setPointInputLat] = useState("");
  const [pointInputLng, setPointInputLng] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GeofenceFormValues>({
    resolver: zodResolver(geofenceSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "delivery_zone",
    },
  });

  const mutation = useMutation({
    mutationFn: geofenceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences"] });
      reset();
      setFormError(null);
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Failed to create geofence");
    },
  });

  const handleMapClick = (lat: number, lng: number) => {
    setPoints((prev) => [...prev, [parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]]);
  };

  const handleAddManualPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(pointInputLat);
    const lng = parseFloat(pointInputLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert("Invalid latitude/longitude coordinates");
      return;
    }
    setPoints((prev) => [...prev, [lat, lng]]);
    setPointInputLat("");
    setPointInputLng("");
  };

  const handleRemovePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: GeofenceFormValues) => {
    if (points.length < 3) {
      setFormError("A polygon geofence must have at least 3 vertices.");
      return;
    }

    setFormError(null);
    mutation.mutate({
      name: data.name,
      description: data.description,
      category: data.category as GeofenceCategory,
      coordinates: points,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Geofence"
      description="Define a virtual perimeter by clicking on the interactive map or entering coordinate vertices."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {formError}
          </div>
        )}

        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Geofence Name *
            </label>
            <Input
              placeholder="e.g. Koramangala Hub"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <Select {...register("category")} error={errors.category?.message}>
              <option value="delivery_zone">Delivery Zone</option>
              <option value="restricted_zone">Restricted Zone (Critical)</option>
              <option value="toll_zone">Toll Zone</option>
              <option value="customer_area">Customer Area</option>
              <option value="office">Corporate / Office</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description (Optional)
          </label>
          <Input
            placeholder="Operational notes, delivery rules, or safety guidelines..."
            {...register("description")}
          />
        </div>

        {/* Interactive Map for Drawing */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Interactive Boundary Editor ({points.length} vertices)
            </label>
            <span className="text-[11px] text-blue-600 font-medium">
              💡 Click anywhere on the map to append a vertex
            </span>
          </div>

          <div className="h-64 w-full rounded-xl border border-slate-200 overflow-hidden relative">
            <LeafletMap
              isDrawing={true}
              drawingPoints={points}
              onMapClick={handleMapClick}
              center={points.length > 0 ? points[0] : [12.9716, 77.5946]}
              zoom={13}
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Manual Vertex Add & Current Coordinates Table */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Lat (e.g. 12.9716)"
              className="h-8 text-xs font-mono"
              value={pointInputLat}
              onChange={(e) => setPointInputLat(e.target.value)}
            />
            <Input
              placeholder="Lng (e.g. 77.5946)"
              className="h-8 text-xs font-mono"
              value={pointInputLng}
              onChange={(e) => setPointInputLng(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddManualPoint}
              className="shrink-0 gap-1 h-8 text-xs"
            >
              <Plus className="h-3 w-3" /> Add Point
            </Button>
          </div>

          <div className="max-h-28 overflow-y-auto divide-y divide-slate-100 bg-white rounded border border-slate-200">
            {points.map((pt, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                <span className="font-mono text-slate-600">
                  #{i + 1}: [{pt[0].toFixed(5)}, {pt[1].toFixed(5)}]
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePoint(i)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending} className="gap-1.5">
            <Check className="h-4 w-4" /> Save Geofence
          </Button>
        </div>
      </form>
    </Modal>
  );
}
