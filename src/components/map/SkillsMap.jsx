import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite doesn't resolve Leaflet's default icon URLs — set them explicitly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function SkillsMap({ center, skills = [], onSkillClick }) {
  if (!center?.lat || !center?.lng) return null;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', minHeight: '420px', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* your own approximate area, not an exact point */}
      <Circle
        center={[center.lat, center.lng]}
        radius={300}
        pathOptions={{ color: '#059669', fillOpacity: 0.15 }}
      />
      {skills
        .filter((s) => s.location?.lat && s.location?.lng)
        .map((skill) => (
          <Marker key={skill.id} position={[skill.location.lat, skill.location.lng]}>
            <Popup>
              <strong>{skill.title}</strong>
              <br />
              {skill.user_name} · {skill.location.city}
              <br />
              <button
                type="button"
                className="text-emerald-700 underline"
                onClick={() => onSkillClick?.(skill)}
              >
                View skill
              </button>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
