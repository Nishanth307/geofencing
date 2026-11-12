import { useState } from "react";
import { Volume2, VolumeX, Server, Wifi, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlertStore } from "@/store/alertStore";
import { useUIStore } from "@/store/uiStore";

export function SettingsPage() {
  const soundEnabled = useAlertStore((state) => state.soundEnabled);
  const toggleSound = useAlertStore((state) => state.toggleSound);

  const wsStatus = useUIStore((state) => state.wsStatus);
  const backendHealthy = useUIStore((state) => state.backendHealthy);

  const [testSoundPlaying, setTestSoundPlaying] = useState(false);

  const playTestSound = () => {
    try {
      setTestSoundPlaying(true);
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().finally(() => setTestSoundPlaying(false));
    } catch {
      setTestSoundPlaying(false);
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws/alerts";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings &amp; Diagnostics</h2>
        <p className="text-xs text-slate-500">
          Configure notifications, inspect backend environment parameters, and test audio alerts.
        </p>
      </div>

      {/* Notifications and Audio Settings */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm">Real-Time Audio Alerts</CardTitle>
          <CardDescription>
            Audible chime triggers whenever a vehicle breaches a geofence perimeter.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Play sound for perimeter events
              </span>
              <p className="text-[11px] text-slate-500">
                Triggers browser audio on entry and exit notifications.
              </p>
            </div>
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleSound}
              className="gap-2 text-xs"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" /> Sound Enabled
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" /> Sound Muted
                </>
              )}
            </Button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Test audio playback:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={playTestSound}
              disabled={testSoundPlaying}
              className="text-xs"
            >
              Play Chime Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connectivity Diagnostics */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm">Connectivity &amp; Endpoints</CardTitle>
          <CardDescription>
            Live connection states to the Go backend services.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-blue-600" /> REST API Service
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {backendHealthy ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-600 break-all">{apiBaseUrl}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-purple-600" /> WebSocket Feed
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                  {wsStatus}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-600 break-all">{wsUrl}</p>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 flex gap-2 text-xs text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <strong>Coordinate Convention:</strong>
              <p className="text-[11px] text-blue-800 mt-0.5">
                The backend utilizes <code>[latitude, longitude]</code> array coordinates. All frontend map operations automatically convert Leaflet&apos;s latlng objects to comply with backend indexing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
