import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Props {
  latitude: number;
  longitude: number;
}

export default function EventMapPreview({ latitude, longitude }: Props) {
  return (
    <div
      className="glass-heavy rounded-2xl overflow-hidden animate-fade-in stagger-1"
      style={{ height: 200 }}
    >
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude, latitude, zoom: 14 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        scrollZoom={false}
        dragRotate={false}
        pitchWithRotate={false}
        attributionControl={false}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="bottom" color="#1a4f3b" />
      </Map>
    </div>
  );
}
