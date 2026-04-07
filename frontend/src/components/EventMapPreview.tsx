import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Props {
  latitude: number;
  longitude: number;
}

export default function EventMapPreview({ latitude, longitude }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [longitude, latitude],
        zoom: 14,
        accessToken: TOKEN,
        interactive: false,
        attributionControl: false,
      });

      new mapboxgl.Marker({ color: "#1a4f3b" })
        .setLngLat([longitude, latitude])
        .addTo(map);

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  if (!TOKEN) return null;

  return (
    <div
      ref={containerRef}
      className="glass-heavy rounded-2xl overflow-hidden animate-fade-in stagger-1"
      style={{ height: 200 }}
    />
  );
}
