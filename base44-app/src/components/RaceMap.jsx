import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36] });
    }
  }, [map, bounds]);
  return null;
}

function checkpointIcon(num) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:hsl(215 28% 8%);
      border:2px solid hsl(43 86% 63%);
      color:hsl(43 86% 63%);
      font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 3px hsla(43,86%,63%,0.18);
    ">${num}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

function startIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:hsl(43 86% 63%);
      border:3px solid hsl(215 28% 8%);
      box-shadow:0 0 0 5px hsla(43,86%,63%,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

const BASEMAPS = {
  plan: {
    label: "Plan",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap"
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri"
  }
};

export default function RaceMap({ trace_preview = [], checkpoints = [], start_point }) {
  const [basemap, setBasemap] = useState("plan");
  const latlngs = useMemo(() => trace_preview.map((p) => [p[0], p[1]]), [trace_preview]);

  const bounds = useMemo(() => {
    const all = [
      ...latlngs,
      ...checkpoints.map((c) => [c.lat, c.lon]),
      ...(start_point ? [[start_point.lat, start_point.lon]] : [])
    ];
    if (!all.length) return null;
    return L.latLngBounds(all);
  }, [latlngs, checkpoints, start_point]);

  const center = start_point
    ? [start_point.lat, start_point.lon]
    : latlngs[0] || [44.07, 7.2];

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`;

  return (
    <div className="relative w-full h-full">
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      className="w-full h-full z-0"
      style={{ background: "#e5e3df" }}
    >
      <TileLayer
        key={basemap}
        attribution={BASEMAPS[basemap].attribution}
        url={BASEMAPS[basemap].url}
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      {bounds && <FitBounds bounds={bounds} />}
      {latlngs.length > 1 && (
        <>
          <Polyline positions={latlngs} pathOptions={{ color: "#1f2937", weight: 7, opacity: 0.55, lineJoin: "round" }} />
          <Polyline positions={latlngs} pathOptions={{ color: "#fc4c02", weight: 4, opacity: 0.95, lineJoin: "round" }} />
        </>
      )}
      {start_point && (
        <Marker position={[start_point.lat, start_point.lon]} icon={startIcon()}>
          <Popup>Départ</Popup>
        </Marker>
      )}
      {checkpoints.map((cp) => (
        <Marker key={cp.num} position={[cp.lat, cp.lon]} icon={checkpointIcon(cp.num)}>
          <Popup>
            <div className="text-xs">
              <div className="font-bold">Checkpoint {cp.num}</div>
              <div>{cp.km} km · {Math.round(cp.alt)} m</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
      <div className="absolute top-2 left-2 z-[400] flex rounded-full bg-white/95 shadow p-0.5 text-[11px] font-semibold">
        {Object.entries(BASEMAPS).map(([key, b]) => (
          <button
            key={key}
            type="button"
            onClick={() => setBasemap(key)}
            className={`px-3 py-1 rounded-full transition-colors ${basemap === key ? "bg-[#1f2937] text-white" : "text-[#1f2937]"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <a
        href={gmapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-[400] rounded-full bg-white/95 shadow px-3 py-1 text-[11px] font-semibold text-[#1f2937]"
      >
        Départ sur Google Maps
      </a>
    </div>
  );
}