import L from "leaflet";

export function createVehicleIcon(vehicleNumber: string, isSelected = false, isInsideAlert = false) {
  const bgColor = isInsideAlert ? "#ef4444" : isSelected ? "#2563eb" : "#0f172a";
  const ringColor = isSelected ? "ring-4 ring-blue-400" : "";

  return L.divIcon({
    className: "custom-vehicle-marker",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
        <div style="background-color: ${bgColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.4);" class="${ringColor}">
          ${vehicleNumber}
        </div>
        <div style="width: 28px; height: 28px; background-color: ${bgColor}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-top: 2px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${bgColor};"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
}

export function createDrawingPointIcon(index: number) {
  return L.divIcon({
    className: "drawing-point-marker",
    html: `
      <div style="width: 22px; height: 22px; background-color: #3b82f6; color: white; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.25); transform: translate(-50%, -50%);">
        ${index + 1}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

