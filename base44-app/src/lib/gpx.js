// Génère un fichier GPX à partir de la trace officielle d'un parcours (trace_preview).
// Téléchargement côté client — aucun stockage backend requis.

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  }[c]));
}

function slug(s) {
  return String(s || "parcours").replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");
}

export function buildRaceGpx(race) {
  const trace = Array.isArray(race.trace_preview) ? race.trace_preview : [];
  const name = race.name || "OTC Parcours";
  const pts = trace.map((p) => {
    const lat = p[0];
    const lon = p[1];
    const alt = p[2];
    const ele = (alt !== undefined && alt !== null && !Number.isNaN(alt))
      ? `\n        <ele>${Number(alt).toFixed(1)}</ele>`
      : "";
    return `      <trkpt lat="${lat}" lon="${lon}">${ele}\n      </trkpt>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="OTC — Off Trail Challenge" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(name)}</name></metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${pts.join("\n")}
    </trkseg>
  </trk>
</gpx>`;
}

// Télécharge la trace GPX officielle : fichier complet si disponible, sinon trace simplifiée.
export function downloadRaceGpx(race) {
  const filename = `otc-${slug(race.name)}.gpx`;
  if (race.gpx_file_url) {
    const a = document.createElement("a");
    a.href = race.gpx_file_url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  const gpx = buildRaceGpx(race);
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}