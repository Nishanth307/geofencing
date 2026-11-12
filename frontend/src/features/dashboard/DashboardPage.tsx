import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Truck,
  Shield,
  Bell,
  AlertTriangle,
  ArrowRight,
  Clock,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/ui/spinner";
import { LeafletMap } from "@/components/maps/LeafletMap";
import { vehicleApi } from "@/services/api/vehicleApi";
import { geofenceApi } from "@/services/api/geofenceApi";
import { alertApi } from "@/services/api/alertApi";
import { violationApi } from "@/services/api/violationApi";
import { locationApi } from "@/services/api/locationApi";
import { formatDate } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

export function DashboardPage() {
  const setSelectedVehicleId = useUIStore((state) => state.setSelectedVehicleId);

  // 1. Fetch Vehicles
  const {
    data: vehiclesData,
    isLoading: loadingVehicles,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehicleApi.list,
  });

  // 2. Fetch Geofences
  const {
    data: geofencesData,
    isLoading: loadingGeofences,
    error: geofencesError,
    refetch: refetchGeofences,
  } = useQuery({
    queryKey: ["geofences"],
    queryFn: geofenceApi.list,
  });

  // 3. Fetch Alert Rules
  const {
    data: alertsData,
    isLoading: loadingAlerts,
    error: alertsError,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertApi.list,
  });

  // 4. Fetch Violations History
  const {
    data: violationsData,
  } = useQuery({
    queryKey: ["violations"],
    queryFn: violationApi.list,
  });

  // 4. Fetch Locations for registered vehicles
  const vehicles = vehiclesData?.vehicles || [];
  const { data: vehicleLocations } = useQuery({
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
            // Location not yet recorded for this vehicle
          }
        })
      );
      return locMap;
    },
    enabled: vehicles.length > 0,
    refetchInterval: 10000,
  });

  if (loadingVehicles || loadingGeofences || loadingAlerts) {
    return <LoadingState message="Connecting to fleet monitoring server..." />;
  }

  if (vehiclesError || geofencesError || alertsError) {
    return (
      <ErrorState
        message="Failed to retrieve operational metrics from backend."
        onRetry={() => {
          refetchVehicles();
          refetchGeofences();
          refetchAlerts();
        }}
      />
    );
  }

  const geofences = geofencesData?.geofences || [];
  const alerts = alertsData?.alerts || [];
  const violations = violationsData?.alerts || alerts;

  // Derived operational metrics from REAL backend data
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const totalGeofences = geofences.length;
  const activeAlertRules = alerts.filter((a) => a.status === "active").length;

  // Calculate today's violations count
  const today = new Date().toDateString();
  const todayViolations = violations.filter(
    (a) => new Date(a.created_at).toDateString() === today
  ).length;

  return (
    <div className="space-y-6">
      {/* 5 Operational Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Vehicles */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Vehicles</span>
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900">{totalVehicles}</div>
            <p className="text-[11px] text-slate-500 mt-1">Fleet assets registered</p>
          </CardContent>
        </Card>

        {/* Active Vehicles */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Fleet</span>
              <Radio className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900">{activeVehicles}</div>
            <p className="text-[11px] text-slate-500 mt-1">Status marked active</p>
          </CardContent>
        </Card>

        {/* Total Geofences */}
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Geofences</span>
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900">{totalGeofences}</div>
            <p className="text-[11px] text-slate-500 mt-1">Virtual boundaries</p>
          </CardContent>
        </Card>

        {/* Active Alert Rules */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
              <Bell className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900">{activeAlertRules}</div>
            <p className="text-[11px] text-slate-500 mt-1">Configured triggers</p>
          </CardContent>
        </Card>

        {/* Today's Violations */}
        <Card className="border-l-4 border-l-red-500 col-span-2 sm:col-span-1">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Violations</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-slate-900">{todayViolations}</div>
            <p className="text-[11px] text-slate-500 mt-1">Cross-boundary events</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Live Map & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map Preview (Spans 2 columns) */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Geospatial Live Preview</CardTitle>
              <CardDescription>Live positions and active zone perimeters</CardDescription>
            </div>
            <Link
              to="/tracking"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Screen Map <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-[380px]">
            <LeafletMap
              geofences={geofences}
              vehicles={vehicles}
              vehicleLocations={vehicleLocations}
              onSelectVehicle={(id) => setSelectedVehicleId(id)}
              className="h-[400px] w-full"
            />
          </CardContent>
        </Card>

        {/* Recent Alerts Feed (1 column) */}
        <Card className="flex flex-col">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest boundary events recorded</CardDescription>
            </div>
            <Link
              to="/violations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400">
                <Bell className="h-8 w-8 mb-2 stroke-1" />
                <p className="text-xs">No alerts recorded yet.</p>
              </div>
            ) : (
              alerts.slice(0, 6).map((item) => (
                <div
                  key={item.alert_id}
                  className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {item.vehicle_number || "Vehicle"}
                    </span>
                    <Badge
                      variant={item.event_type === "entry" ? "warning" : "default"}
                      className="text-[10px] uppercase font-semibold"
                    >
                      {item.event_type}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Geofence: <span className="font-medium text-slate-800">{item.geofence_name || item.geofence_id}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.created_at)}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.alert_id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fleet Overview Table */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fleet Operational Status</CardTitle>
            <CardDescription>Vehicles tracked and active in the system</CardDescription>
          </div>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage fleet <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Vehicle Number</th>
                <th className="px-4 py-3">Driver Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.slice(0, 5).map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{v.vehicle_number}</td>
                  <td className="px-4 py-3 text-slate-700">{v.driver_name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{v.vehicle_type}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{v.phone}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success" className="capitalize text-[10px]">
                      {v.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(v.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

