import { useEffect, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { UserLocation } from "../types/user";

// L.Icon.Default normalmente antepone una "imagePath" autodetectada delante de
// las URLs del ícono, lo que rompe las URLs absolutas que entrega Vite. Se
// elimina ese resolver para que use iconUrl/shadowUrl tal cual se definen.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: UserLocation = { lat: -25.2637, lng: -57.5759 };

interface LocationPickerProps {
  value?: UserLocation;
  onChange: (location: UserLocation) => void;
}

function ClickHandler({ onPick }: { onPick: (location: UserLocation) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

const GEOLOCATE_ZOOM = 16;

function RecenterOnChange({ location, zoom }: { location: UserLocation; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(location, zoom ?? map.getZoom());
  }, [location.lat, location.lng, zoom, map]);
  return null;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [focusZoom, setFocusZoom] = useState<number | undefined>(undefined);
  const center = value ?? DEFAULT_CENTER;

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFocusZoom(GEOLOCATE_ZOOM);
        onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("No pudimos acceder a tu ubicación. Podés marcarla manualmente en el mapa.");
        setLocating(false);
      },
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-outline-variant h-64 relative z-0">
        <MapContainer center={center} zoom={value ? 15 : 12} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && <RecenterOnChange location={value} zoom={focusZoom} />}
          {value && (
            <Marker
              position={value}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target as L.Marker;
                  const position = marker.getLatLng();
                  onChange({ lat: position.lat, lng: position.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="flex items-center gap-2 text-primary font-label-md hover:underline disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg">my_location</span>
          {locating ? "Buscando ubicación..." : "Usar mi ubicación actual"}
        </button>
        {value && (
          <span className="text-body-sm text-on-surface-variant">
            Lat {value.lat.toFixed(5)}, Lng {value.lng.toFixed(5)}
          </span>
        )}
      </div>
      {locationError && <p className="text-error text-body-sm">{locationError}</p>}
      {!value && (
        <p className="text-on-surface-variant text-body-sm">
          Tocá el mapa para marcar tu ubicación (opcional).
        </p>
      )}
    </div>
  );
}
