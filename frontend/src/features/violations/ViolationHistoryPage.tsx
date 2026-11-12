import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Truck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/spinner";
import { LeafletMap } from "@/components/maps/LeafletMap";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { violationApi } from "@/services/api/violationApi";
import { geofenceApi } from "@/services/api/geofenceApi";
import { vehicleApi } from "@/services/api/vehicleApi";
import { AlertItem } from "@/types/alert";
import { formatDate } from "@/lib/utils";

export function ViolationHistoryPage() {
  const queryClient = useQueryClient();
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [geofenceFilter, setGeofenceFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected violation for map inspection modal
  const [inspectViolation, setInspectViolation] = useState<AlertItem | null>(null);

  // Deletion states
  const [violationToDelete, setViolationToDelete] = useState<AlertItem | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bannerNotice, setBannerNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 1. Fetch Violation History
  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["violations"],
    queryFn: violationApi.list,
  });

  // 2. Fetch Geofences for filter & map inspection
  const { data: geofencesData } = useQuery({
    queryKey: ["geofences"],
    queryFn: geofenceApi.list,
  });

  // 3. Fetch Vehicles for filter
  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.list,
  });

  const allViolations = historyData?.alerts || [];
  const geofences = geofencesData?.geofences || [];
  const vehicles = vehiclesData?.vehicles || [];

  // Single delete mutation
  const singleDeleteMutation = useMutation({
    mutationFn: (id: string) => violationApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
      setBannerNotice({
        type: "success",
        message: `Violation ${violationToDelete?.alert_id || deletedId} deleted successfully.`,
      });
      setViolationToDelete(null);
    },
    onError: (err: any) => {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to delete violation record.",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => violationApi.bulkDelete(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setBannerNotice({
        type: "success",
        message: `${res.deleted_count || selectedIds.length} violations deleted successfully.`,
      });
      setSelectedIds([]);
      setIsBulkConfirmOpen(false);
    },
    onError: (err: any) => {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to bulk delete violation records.",
      });
    },
  });

  // Filtered dataset
  const filteredViolations = allViolations.filter((item) => {
    const matchesVehicle =
      vehicleFilter === "all" || item.vehicle_id === vehicleFilter;
    const matchesGeofence =
      geofenceFilter === "all" || item.geofence_id === geofenceFilter;
    const matchesEvent =
      eventTypeFilter === "all" || item.event_type.toLowerCase() === eventTypeFilter.toLowerCase();
    const matchesSearch =
      item.alert_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicle_number && item.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.geofence_name && item.geofence_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesVehicle && matchesGeofence && matchesEvent && matchesSearch;
  });

  // Pagination calculation
  const totalCount = filteredViolations.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedViolations = filteredViolations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection handlers
  const isAllPageSelected =
    paginatedViolations.length > 0 &&
    paginatedViolations.every((v) => selectedIds.includes(v.alert_id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedViolations.map((v) => v.alert_id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...paginatedViolations.map((v) => v.alert_id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading historical geospatial violation logs..." />;
  }

  if (error) {
    return <ErrorState message="Could not fetch violation history from server." onRetry={() => refetch()} />;
  }

  // Find geofence for map inspection if modal is open
  const inspectedGeofence = inspectViolation
    ? geofences.filter((g) => g.id === inspectViolation.geofence_id)
    : [];

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Violation History &amp; Audit Log</h2>
          <p className="text-xs text-slate-500">
            Immutable log of all boundary entry, exit, and unauthorized zone incursions.
          </p>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 shrink-0 animate-in fade-in">
            <span className="text-xs font-semibold text-red-800">
              {selectedIds.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkConfirmOpen(true)}
              className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-7 text-xs text-slate-500"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search by ID or Name
            </label>
            <Input
              placeholder="e.g. alert_ or KA-01..."
              className="text-xs"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter by Vehicle
            </label>
            <Select
              className="text-xs"
              value={vehicleFilter}
              onChange={(e) => {
                setVehicleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.driver_name})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter by Geofence
            </label>
            <Select
              className="text-xs"
              value={geofenceFilter}
              onChange={(e) => {
                setGeofenceFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              Event Trigger Type
            </label>
            <Select
              className="text-xs"
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Event Types</option>
              <option value="entry">Entry Events</option>
              <option value="exit">Exit Events</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Violations Table */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Historical Event Log ({totalCount} entries)</CardTitle>
          <span className="text-[11px] text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {paginatedViolations.length === 0 ? (
            <EmptyState
              title="No historical violations recorded"
              description="No boundary crossing events match your current filter selections."
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <button
                      onClick={toggleSelectAllPage}
                      className="text-slate-400 hover:text-slate-600 flex items-center"
                      title={isAllPageSelected ? "Deselect all on page" : "Select all on page"}
                    >
                      {isAllPageSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Vehicle Details</th>
                  <th className="px-4 py-3">Geofence Name</th>
                  <th className="px-4 py-3">Violation Event</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedViolations.map((item) => {
                  const isSelected = selectedIds.includes(item.alert_id);

                  return (
                    <tr
                      key={item.alert_id}
                      className={`transition-colors ${
                        isSelected ? "bg-blue-50/70" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectRow(item.alert_id)}
                          className="text-slate-400 hover:text-slate-600 flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 font-semibold">
                        {item.alert_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {item.vehicle_number || item.vehicle_id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Shield className="h-3.5 w-3.5 text-blue-600" />
                          {item.geofence_name || item.geofence_id}
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
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1"
                            onClick={() => setInspectViolation(item)}
                          >
                            <Eye className="h-3 w-3" /> Inspect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                            onClick={() => setViolationToDelete(item)}
                            title="Delete Violation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <span className="text-xs text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 gap-1 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Map Inspection Modal */}
      {inspectViolation && (
        <Modal
          isOpen={true}
          onClose={() => setInspectViolation(null)}
          title={`Violation Inspection: ${inspectViolation.alert_id}`}
          description={`Vehicle ${inspectViolation.vehicle_number} triggered ${inspectViolation.event_type} event on ${formatDate(inspectViolation.created_at)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200">
              <LeafletMap
                geofences={inspectedGeofence}
                selectedGeofenceId={inspectViolation.geofence_id}
                center={
                  inspectedGeofence.length > 0 && inspectedGeofence[0].coordinates.length > 0
                    ? inspectedGeofence[0].coordinates[0]
                    : [12.9716, 77.5946]
                }
                zoom={14}
                className="h-full w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Geofence:</span>{" "}
                <strong className="text-slate-900">{inspectViolation.geofence_name || inspectViolation.geofence_id}</strong>
              </div>
              <div>
                <span className="text-slate-500">Trigger:</span>{" "}
                <Badge variant="warning" className="uppercase text-[9px]">
                  {inspectViolation.event_type}
                </Badge>
              </div>
              <div>
                <span className="text-slate-500">Vehicle:</span>{" "}
                <strong className="text-slate-900 font-mono">{inspectViolation.vehicle_number}</strong>
              </div>
              <div>
                <span className="text-slate-500">Logged Time:</span>{" "}
                <span className="text-slate-700">{formatDate(inspectViolation.created_at)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Single Violation Delete Confirmation */}
      {violationToDelete && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setViolationToDelete(null)}
          onConfirm={() => singleDeleteMutation.mutate(violationToDelete.alert_id)}
          title="Delete Violation Record?"
          resourceName={violationToDelete.alert_id}
          description="Are you sure you want to delete this historical violation log from the audit trail?"
          consequences="This record will be permanently deleted from the audit history. This action cannot be undone."
          details={
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-400">Vehicle:</span> {violationToDelete.vehicle_number || violationToDelete.vehicle_id}</div>
              <div><span className="text-slate-400">Geofence:</span> {violationToDelete.geofence_name || violationToDelete.geofence_id}</div>
              <div><span className="text-slate-400">Trigger:</span> {violationToDelete.event_type}</div>
              <div><span className="text-slate-400">Logged:</span> {formatDate(violationToDelete.created_at)}</div>
            </div>
          }
          confirmText="Delete Record"
          isPending={singleDeleteMutation.isPending}
        />
      )}

      {/* Bulk Delete Confirmation */}
      {isBulkConfirmOpen && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setIsBulkConfirmOpen(false)}
          onConfirm={() => bulkDeleteMutation.mutate(selectedIds)}
          title="Bulk Delete Violations?"
          resourceName={`${selectedIds.length} Violation Records`}
          description={`Are you sure you want to permanently delete ${selectedIds.length} selected violation records?`}
          consequences="All selected historical audit entries will be purged from the database. This action is executed as an atomic database transaction."
          confirmText={`Delete ${selectedIds.length} Violations`}
          isPending={bulkDeleteMutation.isPending}
        />
      )}
    </div>
  );
}
