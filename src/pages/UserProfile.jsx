import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Skill, Review, User } from '@/api/entities';
import { auth } from '@/api/auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MapPin, Star, CheckCircle, 
  MoreVertical, Flag, UserMinus, ArrowLeft, Loader2, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import SkillCard from '../components/skills/SkillCard';
import ReviewCard from '../components/reviews/ReviewCard';

export default function UserProfile() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await auth.me();
      setCurrentUser(userData);
    } catch (e) {}
  };

  const { data: profileUser, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const users = await User.filter({ id: userId });
      return users[0];
    },
    enabled: !!userId,
  });

  const { data: userSkills = [] } = useQuery({
    queryKey: ['userSkills', userId],
    queryFn: () => Skill.filter({ user_id: userId, status: 'active' }, '-created_date'),
    enabled: !!userId,
  });

  const { data: userReviews = [] } = useQuery({
    queryKey: ['userReviews', userId],
    queryFn: () => Review.filter({ reviewee_id: userId }, '-created_date'),
    enabled: !!userId,
  });

  const handleBlock = async () => {
    if (!currentUser) {
      auth.redirectToLogin();
      return;
    }

    const blockedUsers = currentUser.blocked_users || [];
    if (!blockedUsers.includes(userId)) {
      await auth.updateMe({
        blocked_users: [...blockedUsers, userId]
      });
      toast.success('User blocked');
    }
  };

  const handleReport = () => {
    toast.info('Report feature - would open report dialog');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">User not found</h2>
        <Link to={createPageUrl('Explore')}>
          <Button>Back to Explore</Button>
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const offeringSkills = userSkills.filter(s => s.type === 'offering');
  const requestingSkills = userSkills.filter(s => s.type === 'requesting');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

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
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                  <AvatarImage src={profileUser.avatar_url} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-4xl">
                    {profileUser.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left pb-4">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{profileUser.full_name}</h1>
                    {profileUser.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {profileUser.location?.city && (
                    <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-1 mb-2">
                      <MapPin className="w-4 h-4" />
                      {profileUser.location.city}
                    </p>
                  )}
                  <p className="text-sm text-slate-400">
                    Member since {format(new Date(profileUser.created_date), 'MMMM yyyy')}
                  </p>
                </div>

                {/* Actions */}
                {!isOwnProfile && currentUser && (
                  <div className="flex items-center gap-2 pb-4">
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleReport}>
                          <Flag className="w-4 h-4 mr-2" />
                          Report User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                          <UserMinus className="w-4 h-4 mr-2" />
                          Block User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {profileUser.total_exchanges || 0}
                  </div>
                  <div className="text-sm text-slate-500">Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                    {Number(profileUser.rating_avg ?? 0).toFixed(1)}
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-sm text-slate-500">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {profileUser.rating_count || 0}
                  </div>
                  <div className="text-sm text-slate-500">Reviews</div>
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-slate-600">{profileUser.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills & Reviews Tabs */}
        <Tabs defaultValue="skills">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-6">
            <TabsTrigger value="skills" className="rounded-lg px-6">
              Skills ({userSkills.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg px-6">
              Reviews ({userReviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            {userSkills.length > 0 ? (
              <div className="space-y-6">
                {offeringSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Offering</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {offeringSkills.map((skill, index) => (
                        <SkillCard key={skill.id} skill={skill} index={index} />
                      ))}
                    </div>
                  </div>
                )}
                {requestingSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Requesting</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {requestingSkills.map((skill, index) => (
                        <SkillCard key={skill.id} skill={skill} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>This user hasn't posted any skills yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Star className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>No reviews yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}