'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getCityCoords } from '@/data/cityCoordinates';
import chinaData from '@/data/china.json';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

type AlumniPoint = { name: string; graduationClass: string; city: string; lat: number; lng: number };

export default function AlumniMap() {
  const [points, setPoints] = useState<AlumniPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alumni/map')
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.alumni || [])
          .map((a: any) => {
            const coords = getCityCoords(a.city);
            return coords ? { ...a, ...coords } : null;
          })
          .filter(Boolean) as AlumniPoint[];
        setPoints(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/50">
        <p className="text-sm text-slate-300">正在加载校友分布图...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/15 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
      <MapContainer
        center={[35, 105]}
        zoom={4}
        scrollWheelZoom={false}
        className="h-80 w-full"
        style={{ background: '#0b1120' }}
      >
        <GeoJSON
          key="china-outline"
          data={chinaData as any}
          style={{
            color: '#22d3ee',
            weight: 0.8,
            opacity: 0.25,
            fillColor: '#1e293b',
            fillOpacity: 0.6,
          }}
        />
        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-gray-500">{p.graduationClass} · {p.city}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="flex items-center gap-2 border-t border-cyan-300/10 bg-slate-900/80 px-4 py-3">
        <MapPin size={14} className="text-cyan-400" />
        <p className="text-xs text-slate-300">
          共 {points.length} 个校友分布点 · 拖动地图浏览
        </p>
      </div>
    </div>
  );
}
