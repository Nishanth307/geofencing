import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Truck, Phone, User, Calendar, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/spinner";
import { RegisterVehicleModal } from "./RegisterVehicleModal";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { vehicleApi } from "@/services/api/vehicleApi";
import { Vehicle } from "@/types/vehicle";
import { formatDate } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

export function VehiclesPage() {
  const queryClient = useQueryClient();
  const selectedVehicleId = useUIStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useUIStore((state) => state.setSelectedVehicleId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    data: vehiclesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.list,
  });

  const vehicles = vehiclesData?.vehicles || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      if (selectedVehicleId === deletedId) {
        setSelectedVehicleId(null);
      }
      setBannerNotice({
        type: "success",
        message: `Vehicle ${vehicleToDelete?.vehicle_number || deletedId} deleted successfully.`,
      });
      setVehicleToDelete(null);
    },
    onError: (err: any) => {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to delete vehicle.",
      });
    },
  });

  const filteredVehicles = vehicles.filter((v) => {
    const matchesType =
      typeFilter === "all" || v.vehicle_type.toLowerCase() === typeFilter.toLowerCase();
    const matchesSearch =
      v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  if (isLoading) {
    return <LoadingState message="Fetching registered fleet assets..." />;
  }

  if (error) {
    return <ErrorState message="Could not retrieve vehicles list." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Toast / Banner Notification */}
      {bannerNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg border text-xs transition-all ${
            bannerNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerNotice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{bannerNotice.message}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fleet Asset Directory</h2>
          <p className="text-xs text-slate-500">
            Manage your registered trucks, vans, cars, and commercial dispatch drivers.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Register Vehicle
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by license plate, driver name, or phone..."
              className="pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              className="text-xs"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Vehicles Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Registered Assets ({filteredVehicles.length})</CardTitle>
          <span className="text-[11px] text-slate-400 font-mono">Real-time status</span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredVehicles.length === 0 ? (
            <EmptyState
              title="No vehicles found"
              description="Register your first vehicle to begin telemetry tracking."
              action={
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Register Vehicle
                </Button>
              }
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Vehicle Details</th>
                  <th className="px-4 py-3">Driver Info</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registration Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 tracking-wide font-mono">
                            {v.vehicle_number}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" /> {v.driver_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" /> {v.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={v.status === "active" ? "success" : "secondary"} className="capitalize text-[10px]">
                        {v.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(v.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVehicleToDelete(v)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <RegisterVehicleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Delete Confirmation Dialog */}
      {vehicleToDelete && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setVehicleToDelete(null)}
          onConfirm={() => deleteMutation.mutate(vehicleToDelete.id)}
          title="Delete Vehicle?"
          resourceName={vehicleToDelete.vehicle_number}
          description="Are you sure you want to delete this vehicle asset from the system?"
          consequences="This action will permanently delete the vehicle from active fleet monitoring. Associated telemetry feeds and alert rules will be revoked. Historical violation audit records will preserve vehicle snapshots."
          details={
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-400">Driver:</span> {vehicleToDelete.driver_name}</div>
              <div><span className="text-slate-400">Type:</span> {vehicleToDelete.vehicle_type}</div>
              <div><span className="text-slate-400">Phone:</span> {vehicleToDelete.phone}</div>
              <div><span className="text-slate-400">ID:</span> {vehicleToDelete.id}</div>
            </div>
          }
          confirmText="Delete Vehicle"
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
