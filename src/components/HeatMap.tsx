'use client';

import { useEffect, useRef } from 'react';
import { Signal, Region, REGION_LABELS } from '@/types';
import { mapStyle } from '@/lib/mapStyle';

interface HeatMapProps {
  signals: Signal[];
  selectedRegion: Region;
}

// Region center coordinates [lng, lat]
const REGION_COORDS: Record<Region, [number, number]> = {
  'global': [0, 20],
  'north-america': [-100, 40],
  'europe': [10, 50],
  'asia-pacific': [120, 35],
  'middle-east': [45, 30],
  'africa': [20, 5],
  'south-america': [-60, -15],
};

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'high': return '#ef4444';
    case 'elevated': return '#f59e0b';
    default: return '#10b981';
  }
}

export function HeatMap({ signals, selectedRegion }: HeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const initMap = async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const center = REGION_COORDS[selectedRegion];
      const zoom = selectedRegion === 'global' ? 1.5 : 3;

      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: mapStyle as maplibregl.StyleSpecification,
        center: center,
        zoom: zoom,
        attributionControl: false,
        minZoom: 1,
        maxZoom: 10,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.on('load', () => {
        // Add heat source
        const heatData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: signals.flatMap((signal) => {
            const baseCoord = REGION_COORDS[signal.region] || REGION_COORDS['global'];
            const intensity = signal.score / 100;
            const features: GeoJSON.Feature[] = [];

            // Main point
            features.push({
              type: 'Feature',
              properties: { intensity, score: signal.score, name: signal.name },
              geometry: { type: 'Point', coordinates: [baseCoord[0], baseCoord[1]] }
            });

            // Scatter points
            for (let i = 0; i < 12; i++) {
              features.push({
                type: 'Feature',
                properties: { intensity: intensity * 0.4 },
                geometry: {
                  type: 'Point',
                  coordinates: [
                    baseCoord[0] + (Math.random() - 0.5) * 25,
                    baseCoord[1] + (Math.random() - 0.5) * 15
                  ]
                }
              });
            }

            return features;
          })
        };

        map.addSource('heat-data', {
          type: 'geojson',
          data: heatData
        });

        // Add heatmap layer
        map.addLayer({
          id: 'heat-layer',
          type: 'heatmap',
          source: 'heat-data',
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': 1.5,
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1, 30, 5, 60, 10, 100],
            'heatmap-opacity': 0.7,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.1, 'rgba(6,78,59,0.4)',
              0.3, 'rgba(4,120,87,0.5)',
              0.5, 'rgba(5,150,105,0.6)',
              0.7, 'rgba(16,185,129,0.7)',
              0.9, 'rgba(52,211,153,0.8)',
              1, 'rgba(110,231,183,0.9)'
            ]
          }
        });

        // Add markers for signals
        signals.forEach((signal) => {
          const coords = REGION_COORDS[signal.region];
          if (!coords) return;

          const color = getStatusColor(signal.status);

          // Create marker element
          const el = document.createElement('div');
          el.className = 'signal-marker';
          el.style.cssText = `
            width: 12px;
            height: 12px;
            background: ${color};
            border: 2px solid rgba(0,0,0,0.8);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px ${color}80;
          `;

          // Create popup
          const popup = new maplibregl.Popup({
            offset: 15,
            closeButton: false,
            className: 'signal-popup'
          }).setHTML(`
            <div style="
              background: #18181b;
              border: 1px solid #3f3f46;
              padding: 12px;
              font-family: monospace;
              font-size: 11px;
              min-width: 200px;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="
                  width: 8px;
                  height: 8px;
                  background: ${color};
                  border-radius: 50%;
                  box-shadow: 0 0 6px ${color};
                "></span>
                <span style="color: #e4e4e7; font-weight: 600;">${signal.name}</span>
              </div>
              <div style="color: #71717a; font-size: 9px; text-transform: uppercase; margin-bottom: 6px;">
                ${REGION_LABELS[signal.region]}
              </div>
              <div style="color: #a1a1aa; margin-bottom: 8px; line-height: 1.4;">
                ${signal.explanation}
              </div>
              <div style="display: flex; gap: 12px; color: #52525b; font-size: 10px;">
                <span>Score: <span style="color: ${color};">${signal.score}</span></span>
                <span>Δ ${signal.baselineComparison}</span>
                <span>${signal.confidence.toUpperCase()}</span>
              </div>
            </div>
          `);

          new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(map);
        });
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedRegion, signals]);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden" style={{ background: '#151518' }}>
      <div ref={mapRef} className="w-full h-full" style={{ background: '#151518' }} />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 text-[9px] text-zinc-500 uppercase tracking-wider pointer-events-none">
        <div className="flex items-center gap-4 mb-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Elevated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> High
          </span>
        </div>
      </div>
    </div>
  );
}

export default HeatMap;
