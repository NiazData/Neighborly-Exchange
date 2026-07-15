import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Skill } from '@/api/entities';
import { auth } from '@/api/auth';
import { useQuery } from '@tanstack/react-query';
import SkillsMap from '@/components/map/SkillsMap';
import { distanceKm, formatDistance } from '@/lib/geo';
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
import { MapPin, CheckCircle, Loader2 } from 'lucide-react';

const categoryIcons = {
  home_repairs: '🔧', technology: '💻', teaching: '📚', gardening: '🌱',
  cooking: '🍳', transportation: '🚗', pet_care: '🐾', childcare: '👶',
  fitness: '💪', arts_crafts: '🎨', music: '🎵', languages: '🌍',
  cleaning: '🧹', moving: '📦', other: '✨'
};

export default function NearbyMap() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
    } catch (e) {
      // not authenticated / no profile yet — empty state below handles it
    } finally {
      setLoading(false);
    }
  };

  // The map is always centered on the viewer's own (fuzzy) area, never their
  // exact coordinates — mirrors the privacy guarantee applied to skill pins.
  const center = user?.fuzzy_lat
    ? { lat: user.fuzzy_lat, lng: user.fuzzy_lng }
    : { lat: user?.location?.lat, lng: user?.location?.lng };
  const hasCenter = Boolean(center.lat && center.lng);

  const { data: skills = [] } = useQuery({
    queryKey: ['mapSkills', selectedCategory, selectedType],
    queryFn: async () => {
      let filter = { status: 'active' };
      if (selectedCategory !== 'all') filter.category = selectedCategory;
      if (selectedType !== 'all') filter.type = selectedType;

      const results = await Skill.filter(filter, '-created_date', 100);
      // Filter skills with location data
      return results.filter((s) => s.location?.lat && s.location?.lng);
    },
    enabled: hasCenter,
  });

  const skillsWithDistance = hasCenter
    ? skills
        .map((skill) => ({
          ...skill,
          distanceKm: distanceKm(center.lat, center.lng, skill.location.lat, skill.location.lng),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
    : [];

  const goToSkill = (skill) => navigate(createPageUrl(`SkillDetail?id=${skill.id}`));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your area...</p>
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

        {!hasCenter ? (
          <Card className="border-slate-100">
            <CardContent className="p-8 text-center">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold text-slate-800 mb-1">Set your area to see the map</h3>
              <p className="text-slate-500 mb-4">
                Add your location on your profile so we can show skills near you.
              </p>
              <Link to={createPageUrl('Profile')}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Set My Location
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
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
                      Your approximate area
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="border-slate-100 overflow-hidden shadow-lg mb-6">
              <div className="h-[60vh] relative">
                <SkillsMap center={center} skills={skills} onSkillClick={goToSkill} />
              </div>
            </Card>

            {/* Nearby skills list */}
            {skillsWithDistance.length > 0 && (
              <Card className="border-slate-100">
                <CardContent className="p-4 divide-y divide-slate-100">
                  {skillsWithDistance.map((skill) => (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => goToSkill(skill)}
                      className="w-full flex items-center gap-3 py-3 text-left hover:bg-slate-50 rounded-lg px-2 transition-colors"
                    >
                      <span className="text-xl">{categoryIcons[skill.category] || '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{skill.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {skill.user_name}
                          {skill.is_verified_user && (
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                          )}
                        </p>
                      </div>
                      <Badge
                        className={
                          skill.type === 'offering'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {skill.type === 'offering' ? 'Offering' : 'Requesting'}
                      </Badge>
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {formatDistance(skill.distanceKm)} away (approx.)
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Skills Count */}
            <p className="text-center text-slate-500 mt-4">
              Showing <span className="font-semibold text-slate-700">{skills.length}</span> skills in your area
            </p>
          </>
        )}
      </div>
    </div>
  );
}
