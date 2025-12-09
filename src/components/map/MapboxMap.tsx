'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  className?: string;
  style?: React.CSSProperties;
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
}

export default function MapboxMap({ 
  className = '', 
  style,
  initialCenter = [138.6007, -34.9285], // Adelaide default
  initialZoom = 12
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false, // Hide default attribution, we can add custom if needed
    });

    // Navigation controls (zoom buttons) removed - users can pinch/scroll to zoom

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenter, initialZoom]);

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-full ${className}`}
      style={style}
    />
  );
}
