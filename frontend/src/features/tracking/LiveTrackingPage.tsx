import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Crosshair,
  Send,
  CheckCircle,
  Truck,
  Radio,
} from "lucide-react";
import { LeafletMap } from "@/components/maps/LeafletMap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/ui/spinner";
import { vehicleApi } from "@/services/api/vehicleApi";
import { geofenceApi } from "@/services/api/geofenceApi";
import { locationApi } from "@/services/api/locationApi";
import { useUIStore } from "@/store/uiStore";
import { formatDate, isValidCoordinate } from "@/lib/utils";

export function LiveTrackingPage() {
  const queryClient = useQueryClient();
  const selectedVehicleId = useUIStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useUIStore((state) => state.setSelectedVehicleId);

  const [searchQuery, setSearchQuery] = useState("");
  const [clickToUpdateEnabled, setClickToUpdateEnabled] = useState(false);
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Fetch vehicles
  const {
    data: vehiclesData,
    isLoading: loadingVehicles,
    error: vehiclesError,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.list,
  });

  // 2. Fetch geofences
  const { data: geofencesData } = useQuery({
    queryKey: ["geofences"],
    queryFn: geofenceApi.list,
  });

  const vehicles = vehiclesData?.vehicles || [];
  const geofences = geofencesData?.geofences || [];

  // 3. Fetch latest locations for vehicles
  const { data: vehicleLocations = {} } = useQuery({
    queryKey: ["all-vehicle-locations", vehicles.map((v) => v.id).join(",")],
    queryFn: async () => {
      const locMap: Record<string, any> = {};
      await Promise.all(
        vehicles.map(async (v) => {
          try {
            const loc = await locationApi.getLatestLocation(v.id);
            if (loc && loc.latitude) {
              locMap[v.id] = loc;
            }
          } catch {
            // Not yet reported
          }
        })
      );
      return locMap;
    },
    enabled: vehicles.length > 0,
    refetchInterval: 5000,
  });

  // Mutation for updating vehicle location
  const locationMutation = useMutation({
    mutationFn: locationApi.updateLocation,
    onSuccess: (res) => {
      setActionSuccess(`Location updated for vehicle! Lat: ${res.latitude.toFixed(4)}, Lng: ${res.longitude.toFixed(4)}`);
      queryClient.invalidateQueries({ queryKey: ["all-vehicle-locations"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const activeLocation = selectedVehicleId ? vehicleLocations[selectedVehicleId] : null;

  // Handle click on map to set coordinates
  const handleMapClick = (lat: number, lng: number) => {
    if (clickToUpdateEnabled && selectedVehicleId) {
      setManualLat(lat.toFixed(6));
      setManualLng(lng.toFixed(6));
    }
  };

  const handleSendLocation = () => {
    if (!selectedVehicleId) return;
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isValidCoordinate(lat, lng)) {
      alert("Please specify valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    locationMutation.mutate({
      vehicle_id: selectedVehicleId,
      latitude: lat,
      longitude: lng,
    });
  };

  if (loadingVehicles) {
    return <LoadingState message="Initializing geospatial tracking engine..." />;
  }

  if (vehiclesError) {
    return <ErrorState message="Could not connect to tracking telemetry backend." />;
  }

  // Calculate center coordinates
  const defaultCenter: [number, number] = activeLocation
    ? [activeLocation.latitude, activeLocation.longitude]
    : [12.9716, 77.5946];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)]">
      {/* Left Sidebar: Vehicle List & Filtering */}
      <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Fleet Assets ({filteredVehicles.length})</CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Live Sync
              </Badge>
            </div>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search vehicle or driver..."
                className="pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>

          {/* Scrollable Vehicle List */}
          <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5">
            {filteredVehicles.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No vehicles match your search.
              </div>
            ) : (
              filteredVehicles.map((v) => {
                const loc = vehicleLocations[v.id];
                const isSelected = selectedVehicleId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      if (loc) {
                        setManualLat(loc.latitude.toFixed(6));
                        setManualLng(loc.longitude.toFixed(6));
                      }
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Truck className={`h-3.5 w-3.5 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                        {v.vehicle_number}
                      </div>
                      <Badge
                        variant={v.status === "active" ? "success" : "secondary"}
                        className="text-[9px] uppercase px-1.5 py-0"
                      >
                        {v.status}
                      </Badge>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-slate-600">
                      <span>{v.driver_name}</span>
                      <span className="capitalize text-[10px] text-slate-400">{v.vehicle_type}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                      <span>Last Seen:</span>
                      <span className="font-mono text-slate-600">
                        {loc?.timestamp ? formatDate(loc.timestamp) : "No telemetry yet"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>

          {/* Selected Vehicle Controller / Manual Telemetry Dispatch */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                {activeVehicle ? `Simulate GPS: ${activeVehicle.vehicle_number}` : "Select a vehicle to test GPS"}
              </span>
              <button
                disabled={!selectedVehicleId}
                onClick={() => setClickToUpdateEnabled(!clickToUpdateEnabled)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-colors ${
                  clickToUpdateEnabled
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                <Crosshair className="inline-block h-3 w-3 mr-1" />
                {clickToUpdateEnabled ? "Click Map: ON" : "Click Map"}
              </button>
            </div>

            {clickToUpdateEnabled && (
              <p className="text-[11px] text-blue-600">
                📍 Click anywhere on the map to set coordinates for this vehicle.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Latitude</label>
                <Input
                  className="h-8 text-xs font-mono"
                  placeholder="12.9716"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  disabled={!selectedVehicleId}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Longitude</label>
                <Input
                  className="h-8 text-xs font-mono"
                  placeholder="77.5946"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  disabled={!selectedVehicleId}
                />
              </div>
            </div>

            <Button
              className="w-full h-8 text-xs gap-1.5"
              onClick={handleSendLocation}
              disabled={!selectedVehicleId || locationMutation.isPending || !manualLat || !manualLng}
              isLoading={locationMutation.isPending}
            >
              <Send className="h-3.5 w-3.5" />
              Ingest Telemetry Ping
            </Button>

            {actionSuccess && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Map Canvas (Interactive Full Height) */}
      <div className="flex-1 flex flex-col min-w-0 h-[500px] lg:h-full">
        <Card className="h-full flex flex-col overflow-hidden relative">
          {/* Floating Map Status Overlay */}
          <div className="absolute top-3 left-14 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              <span className="font-semibold text-slate-800">
                {vehicles.length} Vehicles
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              {geofences.length} Active Zones
            </span>
          </div>

          <LeafletMap
            geofences={geofences}
            vehicles={vehicles}
            vehicleLocations={vehicleLocations}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={(id) => {
              setSelectedVehicleId(id);
              const loc = vehicleLocations[id];
              if (loc) {
                setManualLat(loc.latitude.toFixed(6));
                setManualLng(loc.longitude.toFixed(6));
              }
            }}
            onMapClick={handleMapClick}
            center={defaultCenter}
            zoom={14}
            className="h-full w-full"
          />
        </Card>
      </div>
    </div>
  );
}
