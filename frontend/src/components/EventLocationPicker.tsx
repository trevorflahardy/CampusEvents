import { useState, useCallback, useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import type { MarkerDragEvent, MapRef } from "react-map-gl/mapbox";
import { SearchBox } from "@mapbox/search-js-react";
import type { SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Default center: USF Tampa
const DEFAULT_LNG = -82.4139;
const DEFAULT_LAT = 28.0587;

interface Props {
  locationText: string;
  onLocationTextChange: (text: string) => void;
  pinLat: number | null;
  pinLng: number | null;
  onPinChange: (lat: number, lng: number) => void;
}

export default function EventLocationPicker({
  locationText,
  onLocationTextChange,
  pinLat,
  pinLng,
  onPinChange,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const [pinVisible, setPinVisible] = useState(pinLat !== null);

  const markerLat = pinLat ?? DEFAULT_LAT;
  const markerLng = pinLng ?? DEFAULT_LNG;

  const onDragEnd = useCallback(
    (e: MarkerDragEvent) => {
      onPinChange(e.lngLat.lat, e.lngLat.lng);
    },
    [onPinChange],
  );

  return (
    <div className="space-y-2">
      {TOKEN ? (
        <SearchBox
          accessToken={TOKEN}
          value={locationText}
          onChange={(val: string) => onLocationTextChange(val)}
          onRetrieve={(result: SearchBoxRetrieveResponse) => {
            const feature = result.features[0];
            const coords = feature.geometry.coordinates;
            const lng = coords[0];
            const lat = coords[1];
            onPinChange(lat, lng);
            setPinVisible(true);
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 800 });
            const props = feature.properties as unknown as Record<string, string | undefined>;
            const label = props.name ?? props.full_address ?? locationText;
            onLocationTextChange(label);
          }}
          options={{ country: "US", language: "en" }}
          placeholder="Search for an address..."
        />
      ) : (
        <input
          type="text"
          value={locationText}
          onChange={(e) => onLocationTextChange(e.target.value)}
          placeholder="Enter location address..."
          className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
        />
      )}

      {TOKEN ? (
        <div className="rounded-xl overflow-hidden border border-white/20 dark:border-white/10" style={{ height: 260 }}>
          <Map
            ref={mapRef}
            mapboxAccessToken={TOKEN}
            initialViewState={{
              longitude: markerLng,
              latitude: markerLat,
              zoom: 13,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            <NavigationControl position="top-right" />
            {pinVisible && (
              <Marker
                longitude={markerLng}
                latitude={markerLat}
                anchor="bottom"
                draggable
                onDragEnd={onDragEnd}
                color="#1a4f3b"
              />
            )}
          </Map>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden glass-subtle flex items-center justify-center text-sm text-slate-400" style={{ height: 120 }}>
          Map unavailable — set VITE_MAPBOX_TOKEN in .env
        </div>
      )}

      {pinVisible ? (
        <p className="text-xs text-slate-400">
          Pin at {markerLat.toFixed(5)}, {markerLng.toFixed(5)} — drag to adjust. Location label and pin are independent.
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          {TOKEN ? "Search an address above to drop a pin, or type a location label freely." : "Enter a location name above."}
        </p>
      )}
    </div>
  );
}
