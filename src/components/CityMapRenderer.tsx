'use client';

import { MapContainer, GeoJSON, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import chinaData from '@/data/china.json';

type CityPoint = {
  city: string;
  count: number;
  lat: number;
  lng: number;
};

export default function CityMapRenderer({ cities }: { cities: CityPoint[] }) {
  const maxCount = cities.reduce((m, c) => Math.max(m, c.count), 1);

  const getRadius = (count: number) => {
    if (maxCount <= 1) return 14;
    return 8 + (count / maxCount) * 26;
  };

  const getOpacity = (count: number) => {
    if (maxCount <= 1) return 0.8;
    return 0.4 + (count / maxCount) * 0.5;
  };

  return (
    <MapContainer
      center={[35, 105]}
      zoom={4}
      scrollWheelZoom={false}
      className="h-[360px] w-full md:h-96"
      style={{ background: '#f0edf5' }}
    >
      <GeoJSON
        key="china-outline"
        data={chinaData as any}
        style={{
          color: '#7C3AED',
          weight: 1.2,
          opacity: 0.4,
          fillColor: '#ede6f7',
          fillOpacity: 0.5,
        }}
      />
      {cities.map((c) => (
        <CircleMarker
          key={c.city}
          center={[c.lat, c.lng]}
          radius={getRadius(c.count)}
          pathOptions={{
            color: '#7C3AED',
            fillColor: '#7C3AED',
            fillOpacity: getOpacity(c.count),
            weight: 2,
            opacity: 0.7,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <strong>{c.city}</strong>
            <br />
            {c.count} 位校友
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
