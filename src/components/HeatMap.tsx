'use client';

import { useEffect, useRef } from 'react';
import { Signal, Region, REGION_LABELS } from '@/types';

interface HeatMapProps {
  signals: Signal[];
  selectedRegion: Region;
}

// Region center coordinates
const REGION_COORDS: Record<Region, [number, number]> = {
  'global': [20, 0],
  'north-america': [40, -100],
  'europe': [50, 10],
  'asia-pacific': [35, 120],
  'middle-east': [30, 45],
  'africa': [5, 20],
  'south-america': [-15, -60],
};

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'high': return '#ef4444';
    case 'elevated': return '#f59e0b';
    default: return '#10b981';
  }
}

// Generate heat points for signals
function getHeatPoints(signals: Signal[]): [number, number, number][] {
  const points: [number, number, number][] = [];

  signals.forEach((signal) => {
    const baseCoord = REGION_COORDS[signal.region] || REGION_COORDS['global'];
    const intensity = signal.score / 100;

    // Add main point
    points.push([baseCoord[0], baseCoord[1], intensity]);

    // Add scatter points for visual effect
    for (let i = 0; i < 8; i++) {
      const lat = baseCoord[0] + (Math.random() - 0.5) * 15;
      const lng = baseCoord[1] + (Math.random() - 0.5) * 25;
      points.push([lat, lng, intensity * 0.5]);
    }
  });

  return points;
}

export function HeatMap({ signals, selectedRegion }: HeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet.heat');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const center = REGION_COORDS[selectedRegion];
      const zoom = selectedRegion === 'global' ? 2 : 4;

      const map = L.map(mapRef.current!, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        minZoom: 2,
        maxZoom: 10,
      });

      // Position zoom control
      map.zoomControl.setPosition('bottomright');

      // Dark tile layer - using Stadia dark tiles
      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Create markers layer group
      const markers = L.layerGroup().addTo(map);
      markersRef.current = markers;

      // Add heat layer
      const heatPoints = getHeatPoints(signals);
      // @ts-expect-error - leaflet.heat extends L
      const heat = L.heatLayer(heatPoints, {
        radius: 40,
        blur: 30,
        maxZoom: 8,
        max: 1.0,
        gradient: {
          0.0: '#064e3b',
          0.2: '#047857',
          0.4: '#059669',
          0.6: '#10b981',
          0.8: '#34d399',
          1.0: '#6ee7b7',
        },
      }).addTo(map);

      heatLayerRef.current = heat;

      // Add signal markers with popups
      signals.forEach((signal) => {
        const coords = REGION_COORDS[signal.region];
        if (!coords) return;

        const color = getStatusColor(signal.status);

        // Create custom icon
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 12px;
            height: 12px;
            background: ${color};
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            box-shadow: 0 0 10px ${color}80;
          "></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker(coords, { icon }).addTo(markers);

        // Add popup
        marker.bindPopup(`
          <div style="
            background: #18181b;
            color: #e4e4e7;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            min-width: 200px;
            border: 1px solid #27272a;
          ">
            <div style="
              color: ${color};
              font-weight: 600;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span style="
                width: 8px;
                height: 8px;
                background: ${color};
                border-radius: 50%;
                display: inline-block;
              "></span>
              ${signal.name}
            </div>
            <div style="color: #71717a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
              ${REGION_LABELS[signal.region]}
            </div>
            <div style="margin: 8px 0; color: #a1a1aa;">
              ${signal.explanation}
            </div>
            <div style="
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #27272a;
              padding-top: 8px;
              margin-top: 8px;
            ">
              <span style="color: #71717a;">Score</span>
              <span style="color: ${color}; font-weight: 600;">${signal.score}/100</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #71717a;">Baseline</span>
              <span style="color: #a1a1aa;">${signal.baselineComparison}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #71717a;">Confidence</span>
              <span style="color: #a1a1aa; text-transform: uppercase;">${signal.confidence}</span>
            </div>
          </div>
        `, {
          className: 'custom-popup',
          closeButton: true,
        });
      });
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
    <div className="relative w-full h-full min-h-[300px] overflow-hidden" style={{ background: '#0e0c11' }}>
      <div ref={mapRef} className="w-full h-full" style={{ background: '#0e0c11' }} />
      {/* Overlay gradient for edge fade */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0e0c11]/60 to-transparent" />
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
        <div className="text-zinc-600">Click markers for details</div>
      </div>
    </div>
  );
}
