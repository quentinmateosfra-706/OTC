import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) map.fitBounds(bounds, { paddingTopLeft: [16, 36], paddingBottomRight: [16, 64] });
  }, [map, bounds]);
  return null;
}

// Mini-carte statique (aucune interaction) pour l'en-tête des cartes de course.
export default function RaceThumbnail({ trace_preview = [], start_point }) {
  const latlngs = useMemo(() => trace_preview.map((p) => [p[0], p[1]]), [trace_preview]);
  const bounds = useMemo(() => (latlngs.length ? L.latLngBounds(latlngs) : null), [latlngs]);
  const start = start_point ? [start_point.lat, start_point.lon] : latlngs[0];

  return (
    <MapContainer
      center={start}
      zoom={13}
      className="w-full h-full pointer-events-none"
      style={{ background: "#e5e3df" }}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      {bounds && <FitBounds bounds={bounds} />}
      <Polyline positions={latlngs} pathOptions={{ color: "#1f2937", weight: 6, opacity: 0.5, lineJoin: "round" }} />
      <Polyline positions={latlngs} pathOptions={{ color: "#fc4c02", weight: 3.5, opacity: 0.95, lineJoin: "round" }} />
      {start && (
        <CircleMarker center={start} radius={5} pathOptions={{ color: "#1f2937", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }} />
      )}
    </MapContainer>
  );
}
