import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Polygon,
  Marker,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import { Geofence } from "@/types/geofence";
import { Vehicle } from "@/types/vehicle";
import { LocationResponse } from "@/types/location";
import { getCategoryStyle } from "@/lib/utils";
import { createVehicleIcon, createDrawingPointIcon } from "./mapIcons";

// Helper component to smoothly center/flyTo map when selected item changes
function MapViewController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

// Click event handler for drawing polygon or selecting coordinate
function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export interface LeafletMapProps {
  geofences?: Geofence[];
  vehicles?: Vehicle[];
  vehicleLocations?: Record<string, LocationResponse>;
  selectedVehicleId?: string | null;
  selectedGeofenceId?: string | null;
  onSelectVehicle?: (id: string) => void;
  onSelectGeofence?: (id: string) => void;
  // Drawing mode props
  isDrawing?: boolean;
  drawingPoints?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  onRemoveDrawingPoint?: (index: number) => void;
  // Focus point
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function LeafletMap({
  geofences = [],
  vehicles = [],
  vehicleLocations = {},
  selectedVehicleId,
  selectedGeofenceId,
  onSelectVehicle,
  onSelectGeofence,
  isDrawing = false,
  drawingPoints = [],
  onMapClick,
  center = [12.9716, 77.5946],
  zoom = 13,
  className = "h-full w-full",
}: LeafletMapProps) {
  return (
    <div className={`relative ${className} overflow-hidden rounded-xl`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={center} zoom={zoom} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Existing Geofence Polygons */}
        {geofences.map((gf) => {
          if (!gf.coordinates || gf.coordinates.length < 3) return null;
          const style = getCategoryStyle(gf.category);
          const isSelected = selectedGeofenceId === gf.id;

          // Leaflet expects [lat, lng] array
          const positions: L.LatLngExpression[] = gf.coordinates.map(([lat, lng]) => [lat, lng]);

          return (
            <Polygon
              key={gf.id}
              positions={positions}
              pathOptions={{
                color: isSelected ? "#2563eb" : style.stroke,
                fillColor: style.fill,
                fillOpacity: isSelected ? 0.45 : 0.25,
                weight: isSelected ? 3 : 2,
                dashArray: gf.status === "inactive" ? "4, 4" : undefined,
              }}
              eventHandlers={{
                click: () => onSelectGeofence && onSelectGeofence(gf.id),
              }}
            >
              <Tooltip sticky>
                <div className="font-semibold text-xs">{gf.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{gf.category.replace("_", " ")}</div>
              </Tooltip>
              <Popup>
                <div className="p-1 space-y-1">
                  <div className="font-bold text-sm text-slate-900">{gf.name}</div>
                  <div className="text-xs text-slate-600">{gf.description || "No description provided."}</div>
                  <div className="flex gap-1 pt-1">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                      {gf.category.replace("_", " ")}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {gf.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Live Drawing Points & Polygon Preview */}
        {isDrawing && drawingPoints.length > 0 && (
          <>
            {drawingPoints.map((point, idx) => (
              <Marker
                key={`draw-${idx}`}
                position={point}
                icon={createDrawingPointIcon(idx)}
              />
            ))}
            {drawingPoints.length >= 3 && (
              <Polygon
                positions={drawingPoints}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#60a5fa",
                  fillOpacity: 0.35,
                  weight: 2,
                  dashArray: "6, 6",
                }}
              />
            )}
          </>
        )}

        {/* Vehicle Markers */}
        {vehicles.map((v) => {
          const loc = vehicleLocations[v.id];
          if (!loc || loc.latitude === undefined || loc.longitude === undefined) return null;

          const isSelected = selectedVehicleId === v.id;

          return (
            <Marker
              key={v.id}
              position={[loc.latitude, loc.longitude]}
              icon={createVehicleIcon(v.vehicle_number, isSelected)}
              eventHandlers={{
                click: () => onSelectVehicle && onSelectVehicle(v.id),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-sm text-blue-600">{v.vehicle_number}</span>
                    <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded capitalize">
                      {v.status}
                    </span>
                  </div>
                  <div className="text-xs pt-1">
                    <span className="text-slate-500">Driver:</span> <span className="font-medium">{v.driver_name}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{v.vehicle_type}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Phone:</span> <span className="font-mono text-[11px]">{v.phone}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 font-mono">
                    Lat: {loc.latitude.toFixed(5)}, Lng: {loc.longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
