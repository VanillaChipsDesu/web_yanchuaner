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

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillColor: 'rgba(124, 58, 237, 0.45)', // 悬浮提亮紫
        });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillColor: 'rgba(15, 9, 32, 0.6)', // 恢复深色底
        });
      }
    });
  };

  return (
    <MapContainer
      center={[35, 105]}
      zoom={4}
      scrollWheelZoom={false}
      className="h-[360px] w-full md:h-96"
      style={{ background: '#03010b' }}
    >
      <GeoJSON
        key="china-outline"
        data={chinaData as any}
        style={{
          color: 'rgba(255, 255, 255, 0.15)',
          weight: 0.8,
          opacity: 0.4,
          fillColor: 'rgba(15, 9, 32, 0.6)',
          fillOpacity: 0.8,
        }}
        onEachFeature={onEachFeature}
      />
      {cities.map((c) => (
        <CircleMarker
          key={c.city}
          center={[c.lat, c.lng]}
          radius={getRadius(c.count)}
          pathOptions={{
            color: '#A78BFA',
            fillColor: '#A78BFA',
            fillOpacity: getOpacity(c.count),
            weight: 1.5,
            opacity: 0.8,
            className: 'leaflet-neon-marker',
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
