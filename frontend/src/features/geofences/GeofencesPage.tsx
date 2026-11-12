import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, Search, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/spinner";
import { LeafletMap } from "@/components/maps/LeafletMap";
import { CreateGeofenceModal } from "./CreateGeofenceModal";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { geofenceApi } from "@/services/api/geofenceApi";
import { Geofence } from "@/types/geofence";
import { formatDate, getCategoryStyle } from "@/lib/utils";

export function GeofencesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
  const [geofenceToDelete, setGeofenceToDelete] = useState<Geofence | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    data: geofencesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["geofences"],
    queryFn: geofenceApi.list,
  });

  const geofences = geofencesData?.geofences || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => geofenceApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["geofences"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      if (selectedGeofenceId === deletedId) {
        setSelectedGeofenceId(null);
      }
      setBannerNotice({
        type: "success",
        message: `Geofence "${geofenceToDelete?.name || deletedId}" deleted successfully.`,
      });
      setGeofenceToDelete(null);
    },
    onError: (err: any) => {
      setBannerNotice({
        type: "error",
        message: err.message || "Failed to delete geofence.",
      });
    },
  });

  const filteredGeofences = geofences.filter((gf) => {
    const matchesCategory =
      categoryFilter === "all" || gf.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      gf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gf.description && gf.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return <LoadingState message="Loading virtual boundary configurations..." />;
  }

  if (error) {
    return <ErrorState message="Could not retrieve geofences from server." onRetry={() => refetch()} />;
  }

  const activeGeofence = geofences.find((g) => g.id === selectedGeofenceId);

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

      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Geofence Zones</h2>
          <p className="text-xs text-slate-500">
            Define spatial boundaries, delivery perimeters, and restricted areas.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create Geofence
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search geofences by name or description..."
              className="pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              className="text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="delivery_zone">Delivery Zone</option>
              <option value="restricted_zone">Restricted Zone</option>
              <option value="toll_zone">Toll Zone</option>
              <option value="customer_area">Customer Area</option>
              <option value="office">Office / Depot</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Content Grid: Map Preview + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geofences List Table (2 cols) */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Configured Boundaries ({filteredGeofences.length})</CardTitle>
            <span className="text-[11px] text-slate-400">Click a row to focus map</span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto flex-1">
            {filteredGeofences.length === 0 ? (
              <EmptyState
                title="No geofences found"
                description="Create a new boundary or adjust your category filter."
                action={
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    Create First Geofence
                  </Button>
                }
              />
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Vertices</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGeofences.map((gf) => {
                    const style = getCategoryStyle(gf.category);
                    const isSelected = selectedGeofenceId === gf.id;

                    return (
                      <tr
                        key={gf.id}
                        onClick={() => setSelectedGeofenceId(gf.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/80 font-medium" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: style.stroke }}
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{gf.name}</div>
                              {gf.description && (
                                <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                  {gf.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${style.badge}`}
                          >
                            {gf.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {gf.coordinates?.length || 0} pts
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="success" className="capitalize text-[10px]">
                            {gf.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(gf.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGeofenceToDelete(gf);
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                            title="Delete Geofence"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Map Preview of Selected Zone (1 col) */}
        <Card className="h-[450px] lg:h-auto flex flex-col overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Zone Visualization</CardTitle>
              <span className="text-[11px] text-slate-500">
                {activeGeofence ? activeGeofence.name : "All Geofences"}
              </span>
            </div>
            <Shield className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0 flex-1 relative">
            <LeafletMap
              geofences={filteredGeofences}
              selectedGeofenceId={selectedGeofenceId}
              onSelectGeofence={(id) => setSelectedGeofenceId(id)}
              center={
                activeGeofence && activeGeofence.coordinates.length > 0
                  ? activeGeofence.coordinates[0]
                  : [12.9716, 77.5946]
              }
              zoom={activeGeofence ? 14 : 12}
              className="h-full w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Creation Modal */}
      <CreateGeofenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Delete Confirmation Dialog */}
      {geofenceToDelete && (
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={() => setGeofenceToDelete(null)}
          onConfirm={() => deleteMutation.mutate(geofenceToDelete.id)}
          title="Delete Geofence?"
          resourceName={geofenceToDelete.name}
          description="Are you sure you want to delete this virtual boundary zone from the system?"
          consequences="This boundary polygon will be removed from map monitoring and will no longer trigger entry or exit detection. Any alert rules associated with this geofence will also be deactivated. Historical violation logs will preserve boundary snapshots."
          details={
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-400">Category:</span> {geofenceToDelete.category}</div>
              <div><span className="text-slate-400">Points:</span> {geofenceToDelete.coordinates?.length || 0} coordinates</div>
              <div className="col-span-2"><span className="text-slate-400">ID:</span> {geofenceToDelete.id}</div>
            </div>
          }
          confirmText="Delete Geofence"
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
