import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Skill, Review } from '@/api/entities';
import { auth } from '@/api/auth';
import { UploadFile } from '@/api/storage';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pencil, MapPin, Star, CheckCircle, Shield, Camera,
  ArrowRightLeft, Loader2, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
      setEditData({
        bio: userData.bio || '',
        phone: userData.phone || '',
        location: userData.location || { city: '' }
      });
    } catch (e) {
      auth.redirectToLogin();
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Your browser does not support location — you can still type your suburb.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditData((d) => ({
          ...d,
          location: {
            ...(d.location || {}),
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        }));
        setLocating(false);
        toast.success('Location captured!');
      },
      () => {
        setLocating(false);
        toast.error('Could not read your location — you can still type your suburb.');
      }
    );
  };

  const { data: mySkills = [] } = useQuery({
    queryKey: ['profileSkills', user?.id],
    queryFn: () => Skill.filter({ user_id: user.id, status: 'active' }, '-created_date', 4),
    enabled: !!user?.id,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['profileReviews', user?.id],
    queryFn: () => Review.filter({ reviewee_id: user.id }, '-created_date', 5),
    enabled: !!user?.id,
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await auth.updateMe({ avatar_url: file_url });
      await loadUser();
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    await auth.updateMe(editData);
    await loadUser();
    setShowEditDialog(false);
    setLoading(false);
    toast.success('Profile updated!');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-slate-100 overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-4xl">
                      {user.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-slate-600" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left pb-4">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
                    {user.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {user.location?.city && (
                    <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-1 mb-2">
                      <MapPin className="w-4 h-4" />
                      {user.location.city}
                    </p>
                  )}
                  <p className="text-sm text-slate-400">
                    Member since {format(new Date(user.created_date), 'MMMM yyyy')}
                  </p>
                </div>

                {/* Actions */}
                <div className="pb-4">
                  <Button onClick={() => setShowEditDialog(true)} variant="outline">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {user.total_exchanges || 0}
                  </div>
                  <div className="text-sm text-slate-500">Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                    {user.average_rating?.toFixed(1) || '0.0'}
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-sm text-slate-500">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {user.trust_score || 0}
                  </div>
                  <div className="text-sm text-slate-500">Trust Score</div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-slate-600">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Card */}
        {!user.is_verified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Shield className="w-8 h-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-800">Get Verified</h3>
                    <p className="text-sm text-amber-700">
                      Verified users get more trust and visibility. Complete identity verification now.
                    </p>
                  </div>
                  <Link to={createPageUrl('Verification')}>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      Verify Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Skills</CardTitle>
                <Link to={createPageUrl('MySkills')}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {mySkills.length > 0 ? (
                  <div className="grid gap-4">
                    {mySkills.slice(0, 2).map((skill) => (
                      <div key={skill.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={skill.type === 'offering' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                          }>
                            {skill.type === 'offering' ? 'Offering' : 'Requesting'}
                          </Badge>
                          <span className="text-xs text-slate-400">{skill.category}</span>
                        </div>
                        <h4 className="font-medium text-slate-800">{skill.title}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>No skills posted yet</p>
                    <Link to={createPageUrl('MySkills')}>
                      <Button variant="outline" size="sm" className="mt-3">
                        Post Your First Skill
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {myReviews.length > 0 ? (
                  <div className="space-y-4">
                    {myReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-slate-500">{review.reviewer_name}</span>
                        </div>
                        <p className="text-sm text-slate-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Star className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>No reviews yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell others about yourself..."
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="Your phone number"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>City / Suburb</Label>
                <Input
                  placeholder="Your city or suburb"
                  value={editData.location?.city || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    location: { ...editData.location, city: e.target.value }
                  })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Area on the map</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="mt-1.5 w-full"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  {editData.location?.lat ? 'Update My Location' : 'Find My Area'}
                </Button>
                <p className="text-xs text-slate-500 mt-1.5">
                  Your exact location is never shown — neighbors only ever see an
                  approximate area (~300 m).
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}