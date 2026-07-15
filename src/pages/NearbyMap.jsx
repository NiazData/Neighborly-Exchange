import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Skill } from '@/api/entities';
import { auth } from '@/api/auth';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Navigation, CheckCircle, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categoryIcons = {
  home_repairs: '🔧', technology: '💻', teaching: '📚', gardening: '🌱',
  cooking: '🍳', transportation: '🚗', pet_care: '🐾', childcare: '👶',
  fitness: '💪', arts_crafts: '🎨', music: '🎵', languages: '🌍',
  cleaning: '🧹', moving: '📦', other: '✨'
};

export default function NearbyMap() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    loadUser();
    getUserLocation();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
      if (userData.location?.lat && userData.location?.lng) {
        setUserLocation([userData.location.lat, userData.location.lng]);
      }
    } catch (e) {}
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoading(false);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
          // Default to a central location
          setUserLocation([40.7128, -74.0060]); // NYC
          setLoading(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setUserLocation([40.7128, -74.0060]);
      setLoading(false);
    }
  };

  const { data: skills = [] } = useQuery({
    queryKey: ['mapSkills', selectedCategory, selectedType],
    queryFn: async () => {
      let filter = { status: 'active' };
      if (selectedCategory !== 'all') filter.category = selectedCategory;
      if (selectedType !== 'all') filter.type = selectedType;
      
      const results = await Skill.filter(filter, '-created_date', 100);
      // Filter skills with location data
      return results.filter(s => s.location?.lat && s.location?.lng);
    },
  });

  // Create custom marker icon
  const createCustomIcon = (type) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-8 h-8 rounded-full ${
        type === 'offering' ? 'bg-emerald-500' : 'bg-amber-500'
      } flex items-center justify-center text-white shadow-lg border-2 border-white">
        <span class="text-xs font-bold">${type === 'offering' ? 'O' : 'R'}</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Nearby Skills</h1>
          <p className="text-slate-600">Find skills and services in your neighborhood</p>
        </div>

        {locationError && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-600" />
              <p className="text-amber-700">{locationError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={getUserLocation}
                className="ml-auto"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 border-slate-100">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="home_repairs">🔧 Home Repairs</SelectItem>
                  <SelectItem value="technology">💻 Technology</SelectItem>
                  <SelectItem value="teaching">📚 Teaching</SelectItem>
                  <SelectItem value="gardening">🌱 Gardening</SelectItem>
                  <SelectItem value="cooking">🍳 Cooking</SelectItem>
                  <SelectItem value="pet_care">🐾 Pet Care</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="offering">Offering</SelectItem>
                  <SelectItem value="requesting">Requesting</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-4 text-sm text-slate-500 ml-auto">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  Offering
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  Requesting
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="border-slate-100 overflow-hidden shadow-lg">
          <div className="h-[60vh] relative">
            {userLocation && (
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 5 mile radius circle */}
                <Circle
                  center={userLocation}
                  radius={8047} // 5 miles in meters
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />

                {/* User marker */}
                <Marker position={userLocation}>
                  <Popup>
                    <div className="text-center p-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-blue-500 flex items-center justify-center mb-2">
                        <Navigation className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-medium">Your Location</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Skill markers */}
                {skills.map((skill) => (
                  <Marker
                    key={skill.id}
                    position={[skill.location.lat, skill.location.lng]}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{categoryIcons[skill.category]}</span>
                          <Badge className={`text-xs ${
                            skill.type === 'offering' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {skill.type === 'offering' ? 'Offering' : 'Requesting'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">{skill.title}</h3>
                        <p className="text-sm text-slate-500 mb-2">{skill.user_name}</p>
                        {skill.is_verified_user && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </div>
                        )}
                        <Link to={createPageUrl(`SkillDetail?id=${skill.id}`)}>
                          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </Card>

        {/* Skills Count */}
        <p className="text-center text-slate-500 mt-4">
          Showing <span className="font-semibold text-slate-700">{skills.length}</span> skills in your area
        </p>
      </div>

      <style>{`
        .custom-marker {
          background: none;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}