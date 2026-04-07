import { useState, useCallback, useRef, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

const DEFAULT_LNG = -82.4139;
const DEFAULT_LAT = 28.0587;

interface GeoResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [pinVisible, setPinVisible] = useState(pinLat !== null);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchInput, setSearchInput] = useState(locationText);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const markerLat = pinLat ?? DEFAULT_LAT;
  const markerLng = pinLng ?? DEFAULT_LNG;

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync external locationText changes
  useEffect(() => {
    setSearchInput(locationText);
  }, [locationText]);

  // Initialize map
  useEffect(() => {
    if (!TOKEN || !mapContainerRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapContainerRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [markerLng, markerLat],
        zoom: 13,
        accessToken: TOKEN,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const marker = new mapboxgl.Marker({ color: "#1a4f3b", draggable: true })
        .setLngLat([markerLng, markerLat])
        .addTo(map);

      if (!pinVisible) marker.getElement().style.display = "none";

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onPinChange(lngLat.lat, lngLat.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when pin changes
  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.setLngLat([markerLng, markerLat]);
    if (pinVisible) {
      markerRef.current.getElement().style.display = "";
    }
  }, [markerLng, markerLat, pinVisible]);

  // Geocoding search
  const searchAddress = useCallback(async (query: string) => {
    if (!TOKEN || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=us&limit=5&language=en`,
      );
      const data = await res.json();
      setSuggestions(
        (data.features || []).map(
          (f: {
            id: string;
            place_name: string;
            center: [number, number];
          }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          }),
        ),
      );
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    onLocationTextChange(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 300);
  };

  const handleSelect = (result: GeoResult) => {
    const [lng, lat] = result.center;
    onLocationTextChange(result.place_name);
    setSearchInput(result.place_name);
    onPinChange(lat, lng);
    setPinVisible(true);
    setShowSuggestions(false);
    setSuggestions([]);

    mapInstanceRef.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 800,
    });
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      markerRef.current.getElement().style.display = "";
    }
  };

  return (
    <div className="space-y-2">
      {/* Address search input */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search for an address..."
            className="w-full input-glass rounded-xl pl-9 pr-4 py-2.5 text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                handleInputChange("");
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg border bg-white/95 backdrop-blur-xl border-white/40 dark:bg-[#0f1419]/95 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-[#1a4f3b]/8 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-2"
                >
                  <svg
                    className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{s.place_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      {TOKEN ? (
        <div
          ref={mapContainerRef}
          className="rounded-xl overflow-hidden border border-white/20 dark:border-white/10"
          style={{ height: 260 }}
        />
      ) : (
        <div
          className="rounded-xl overflow-hidden glass-subtle flex items-center justify-center text-sm text-slate-400"
          style={{ height: 120 }}
        >
          Map unavailable — set VITE_MAPBOX_TOKEN in .env
        </div>
      )}

      {pinVisible ? (
        <p className="text-xs text-slate-400">
          Pin at {markerLat.toFixed(5)}, {markerLng.toFixed(5)} — drag to
          adjust.
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          {TOKEN
            ? "Search an address above to drop a pin, or type a location label freely."
            : "Enter a location name above."}
        </p>
      )}
    </div>
  );
}
