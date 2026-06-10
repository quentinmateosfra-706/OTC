/**
 * Affiche la trace GPX d'une course sur une carte Mapbox.
 *
 * ⚠️  Mapbox (@rnmapbox/maps) nécessite un dev build EAS —
 *     il n'est PAS compatible avec Expo Go.
 *
 * En attendant le dev build (ou si la clé est absente), on affiche
 * un placeholder ardoise avec la distance et le dénivelé.
 *
 * Quand le build natif est disponible, ce composant s'active automatiquement
 * dès que EXPO_PUBLIC_MAPBOX_TOKEN est renseigné dans .env.
 *
 * La trace GPX est rendue en jaune Frontale (#F2C14E), fine et continue,
 * fidèle à l'identité visuelle « Trace Solitaire ».
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { colors, spacing, radius } from '@/constants/theme';
import { config } from '@/constants/config';

interface MapboxTraceViewProps {
  /** Coordonnées de la trace [[lng, lat], ...]. */
  coordinates: [number, number][];
  /** Hauteur de la carte en pixels. */
  height?: number;
  /** Affiche les checkpoints sur la carte. */
  checkpoints?: Array<{ lat: number; lng: number; order: number }>;
}

export function MapboxTraceView({
  coordinates,
  height = 240,
  checkpoints = [],
}: MapboxTraceViewProps) {
  const [MapboxReady, setMapboxReady] = useState(false);
  const [MapboxComponents, setMapboxComponents] = useState<null | {
    MapboxGL: typeof import('@rnmapbox/maps').default;
    ShapeSource: typeof import('@rnmapbox/maps').ShapeSource;
    LineLayer: typeof import('@rnmapbox/maps').LineLayer;
    CircleLayer: typeof import('@rnmapbox/maps').CircleLayer;
    Camera: typeof import('@rnmapbox/maps').Camera;
  }>(null);

  useEffect(() => {
    if (!config.mapbox.token || config.mapbox.token === 'TODO') return;

    // Import dynamique : évite le crash en Expo Go (module natif absent).
    void (async () => {
      try {
        const mb = await import('@rnmapbox/maps');
        mb.default.setAccessToken(config.mapbox.token);
        setMapboxComponents({
          MapboxGL: mb.default,
          ShapeSource: mb.ShapeSource,
          LineLayer: mb.LineLayer,
          CircleLayer: mb.CircleLayer,
          Camera: mb.Camera,
        });
        setMapboxReady(true);
      } catch {
        // Toujours en Expo Go ou module natif absent → placeholder.
      }
    })();
  }, []);

  // ─── Placeholder (pas de clé ou Expo Go) ──────────────────────────────────
  if (!MapboxReady || !MapboxComponents) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Ionicons name="map-outline" size={36} color={colors.accent} />
        <AppText variant="caption" color={colors.textMuted} style={styles.placeholderText}>
          Carte disponible avec un dev build EAS.{'\n'}
          (EXPO_PUBLIC_MAPBOX_TOKEN requis)
        </AppText>
        {/* Représentation symbolique de la trace : trait jaune horizontal */}
        <View style={styles.traceLine} />
      </View>
    );
  }

  // ─── Carte réelle Mapbox ───────────────────────────────────────────────────
  const { MapboxGL, ShapeSource, LineLayer, CircleLayer, Camera } = MapboxComponents;

  // Calcul du centre de la trace (bbox).
  const lngs = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

  const traceGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {},
      },
    ],
  };

  const checkpointsGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: checkpoints.map((cp) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [cp.lng, cp.lat] },
      properties: { order: cp.order },
    })),
  };

  return (
    <View style={{ height, borderRadius: radius.lg, overflow: 'hidden' }}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL="mapbox://styles/mapbox/dark-v11"
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
      >
        <Camera
          centerCoordinate={[centerLng, centerLat]}
          zoomLevel={10}
          animationMode="none"
        />

        {/* Trace principale — jaune Frontale */}
        <ShapeSource id="trace" shape={traceGeoJson}>
          <LineLayer
            id="traceLine"
            style={{
              lineColor: colors.accent,
              lineWidth: 2,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        </ShapeSource>

        {/* Checkpoints — points blancs avec contour */}
        {checkpoints.length > 0 && (
          <ShapeSource id="checkpoints" shape={checkpointsGeoJson}>
            <CircleLayer
              id="checkpointCircles"
              style={{
                circleRadius: 5,
                circleColor: colors.white,
                circleStrokeWidth: 1.5,
                circleStrokeColor: colors.accent,
              }}
            />
          </ShapeSource>
        )}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderText: { textAlign: 'center', maxWidth: 240 },
  traceLine: {
    width: 120,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
    opacity: 0.5,
  },
});
