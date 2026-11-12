import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, Truck, Calendar, Radio, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/spinner";
import { ConfigureAlertModal } from "./ConfigureAlertModal";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { alertApi } from "@/services/api/alertApi";
import { geofenceApi } from "@/services/api/geofenceApi";
import { vehicleApi } from "@/services/api/vehicleApi";
import { AlertItem } from "@/types/alert";
import { formatDate } from "@/lib/utils";

export function AlertsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geofenceFilter, setGeofenceFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [alertToDelete, setAlertToDelete] = useState<AlertItem | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 1. Fetch Alerts
  const {
    data: alertsData,
    isLoading: loadingAlerts,
    error: alertsError,
    refetch,
  } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertApi.list,
  });

  // 2. Fetch Geofences for filter
  const { data: geofencesData } = useQuery({
    queryKey: ["geofences"],
    queryFn: geofenceApi.list,
  });

  // 3. Fetch Vehicles for filter
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.list,
  });

  const alerts = alertsData?.alerts || [];
  const geofences = geofencesData?.geofences || [];
  const vehicles = vehiclesData?.vehicles || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setBannerNotice({
        type: "success",
        message: `Alert rule ${deletedId} deleted successfully.`,
      });
      setAlertToDelete(null);
    },
    onError: (err: any) => {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to delete alert rule.",
      });
    },
  });

  const filteredAlerts = alerts.filter((a) => {
    const matchesGeofence = geofenceFilter === "all" || a.geofence_id === geofenceFilter;
    const matchesVehicle = vehicleFilter === "all" || a.vehicle_id === vehicleFilter;
    return matchesGeofence && matchesVehicle;
  });

  if (loadingAlerts) {
    return <LoadingState message="Retrieving configured alert rules..." />;
  }

  if (alertsError) {
    return <ErrorState message="Could not fetch alert configurations." onRetry={() => refetch()} />;
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Alert Configuration</h2>
          <p className="text-xs text-slate-500">
            Define boundary breach rules, entry/exit notifications, and vehicle assignments.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Configure Alert Rule
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter by Geofence
            </label>
            <Select
              className="text-xs"
              value={geofenceFilter}
              onChange={(e) => setGeofenceFilter(e.target.value)}
            >
              <option value="all">All Geofences</option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter by Vehicle
            </label>
            <Select
              className="text-xs"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.driver_name})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Configured Rules &amp; Triggers ({filteredAlerts.length})</CardTitle>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Dispatch Active
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredAlerts.length === 0 ? (
            <EmptyState
              title="No alert rules found"
              description="Configure an alert rule to start monitoring perimeter breaches."
              action={
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Configure Alert Rule
                </Button>
              }
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Alert ID</th>
                  <th className="px-4 py-3">Geofence Name</th>
                  <th className="px-4 py-3">Target Vehicle</th>
                  <th className="px-4 py-3">Trigger Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((item) => (
                  <tr key={item.alert_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {item.alert_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {item.geofence_name || item.geofence_id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {item.vehicle_number ? (
                          <span className="font-medium font-mono">{item.vehicle_number}</span>
                        ) : (
                          <span className="text-slate-400 italic">All Vehicles (Global)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={item.event_type === "entry" ? "warning" : "default"}
                        className="uppercase text-[9px] font-semibold"
                      >
                        {item.event_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" className="capitalize text-[10px]">
                        {item.status || "active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAlertToDelete(item)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Delete Alert Rule"
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

      <ConfigureAlertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Delete Confirmation Dialog */}
      {alertToDelete && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setAlertToDelete(null)}
          onConfirm={() => deleteMutation.mutate(alertToDelete.alert_id)}
          title="Delete Alert Rule?"
          resourceName={alertToDelete.alert_id}
          description="Are you sure you want to deactivate and remove this perimeter alert rule?"
          consequences="Once deleted, this rule will immediately stop dispatching entry/exit notifications for the target vehicle and boundary. Previously generated historical violation records will remain preserved."
          details={
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-400">Geofence:</span> {alertToDelete.geofence_name || alertToDelete.geofence_id}</div>
              <div><span className="text-slate-400">Vehicle:</span> {alertToDelete.vehicle_number || "All Vehicles"}</div>
              <div><span className="text-slate-400">Trigger:</span> {alertToDelete.event_type}</div>
              <div><span className="text-slate-400">Status:</span> {alertToDelete.status || "active"}</div>
            </div>
          }
          confirmText="Delete Alert Rule"
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
