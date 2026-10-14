import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { Mountain, TrendingUp, Locate, Crosshair } from "lucide-react";
import { courses } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const FRANCE_CENTER = [46.6, 2.4];

function makeIcon(available) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${available ? "hsl(43 86% 63%)" : "hsl(215 12% 62%)"};
      border:2px solid #1a1f26;
      box-shadow:0 0 0 4px ${available ? "hsla(43,86%,63%,0.25)" : "hsla(215,12%,62%,0.2)"};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

const radii = [
  { label: "France entière", value: 0 },
  { label: "200 km", value: 200 },
  { label: "100 km", value: 100 },
  { label: "50 km", value: 50 }
];

export default function MapView() {
  const [radius, setRadius] = useState(0);
  const [userPos] = useState([43.6, 1.45]); // mock: Toulouse area
  const [selected, setSelected] = useState(null);

  // simple distance filter (mock, around userPos)
  const visible = useMemo(() => {
    if (radius === 0) return courses;
    return courses.filter((c) => {
      const d = haversine(userPos, c.coords);
      return d <= radius;
    });
  }, [radius]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <span className="text-[11px] tracking-[0.3em] uppercase text-primary font-medium">Carte</span>
        <h1 className="mt-2 font-heading font-bold text-3xl tracking-tight">Parcours autour de toi</h1>
        <p className="mt-1 text-sm text-muted-foreground">France · PACA · Var · Toulon · parcours disponibles</p>
      </div>

      {/* Radius selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Crosshair className="w-4 h-4 text-muted-foreground shrink-0" />
        {radii.map((r) => (
          <button
            key={r.value}
            onClick={() => setRadius(r.value)}
            className={cn("shrink-0 text-xs px-3.5 py-1.5 rounded-full border transition-colors",
              radius === r.value ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Map */}
        <div className="relative h-[60vh] lg:h-[70vh] rounded-3xl overflow-hidden border border-border">
          <MapContainer
            center={radius === 0 ? FRANCE_CENTER : userPos}
            zoom={radius === 0 ? 6 : 9}
            zoomControl={false}
            className="w-full h-full bg-background"
            style={{ background: "hsl(215 28% 8%)" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            {visible.map((c) => (
              <Marker
                key={c.id}
                position={c.coords}
                icon={makeIcon(c.status === "available")}
                eventHandlers={{ click: () => setSelected(c.id) }}
              >
                <Popup className="otc-popup">
                  <div className="text-xs">
                    <div className="font-bold text-sm mb-0.5">{c.name}</div>
                    <div className="text-muted-foreground">{c.region} · {c.distance} km · +{c.dplus} m</div>
                    <Link to={`/parcours/${c.id}`} className="text-primary font-medium mt-1 inline-block">Voir le parcours →</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="pointer-events-none absolute top-3 left-3 text-[10px] tracking-wider uppercase text-muted-foreground bg-background/70 backdrop-blur px-2.5 py-1 rounded-full border border-border">
            {visible.length} parcours
          </div>
        </div>

        {/* Side list */}
        <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto pr-1">
          {visible.map((c) => (
            <Link
              key={c.id}
              to={`/parcours/${c.id}`}
              onMouseEnter={() => setSelected(c.id)}
              className={cn("block rounded-2xl border bg-card p-3.5 transition-colors",
                selected === c.id ? "border-primary/40" : "border-border hover:border-border/80")}
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.region}</div>
                <span className={cn("w-2 h-2 rounded-full", c.status === "available" ? "bg-primary" : "bg-muted-foreground/40")} />
              </div>
              <div className="font-heading font-semibold text-sm mt-1 leading-tight">{c.name}</div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Mountain className="w-3 h-3" />{c.distance} km</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{c.dplus} m</span>
              </div>
            </Link>
          ))}
          {visible.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">Aucun parcours dans ce rayon.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}