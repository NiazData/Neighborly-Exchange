import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Skill, Exchange, Review, Report, User } from '@/api/entities';
import { auth } from '@/api/auth';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, MapPin, Clock, Eye, Star, CheckCircle, 
  MessageSquare, Flag, MoreVertical, Share2,
  Loader2, ArrowRightLeft, UserMinus
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Seo from '@/components/Seo';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SITE_URL = 'https://neighbourly-exchange.netlify.app';

const categoryIcons = {
  home_repairs: '🔧', technology: '💻', teaching: '📚', gardening: '🌱',
  cooking: '🍳', transportation: '🚗', pet_care: '🐾', childcare: '👶',
  fitness: '💪', arts_crafts: '🎨', music: '🎵', languages: '🌍',
  cleaning: '🧹', moving: '📦', other: '✨'
};

export default function SkillDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const skillId = params.get('id');
  
  const [user, setUser] = useState(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [exchangeOffer, setExchangeOffer] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: skill, isLoading: skillLoading } = useQuery({
    queryKey: ['skill', skillId],
    queryFn: async () => {
      const results = await Skill.filter({ id: skillId });
      if (results.length > 0) {
        // Increment views
        await supabase.rpc('increment_skill_views', { skill: skillId });
        return results[0];
      }
      return null;
    },
    enabled: !!skillId,
  });

  const { data: skillOwner } = useQuery({
    queryKey: ['skillOwner', skill?.user_id],
    queryFn: async () => {
      const users = await User.filter({ id: skill.user_id });
      return users[0];
    },
    enabled: !!skill?.user_id,
  });

  const { data: ownerReviews = [] } = useQuery({
    queryKey: ['ownerReviews', skill?.user_id],
    queryFn: () => Review.filter({ reviewee_id: skill.user_id }, '-created_date', 5),
    enabled: !!skill?.user_id,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      return Exchange.create({
        skill_id: skill.id,
        skill_title: skill.title,
        provider_id: skill.type === 'offering' ? skill.user_id : user.id,
        provider_name: skill.type === 'offering' ? skill.user_name : user.full_name,
        requester_id: skill.type === 'offering' ? user.id : skill.user_id,
        requester_name: skill.type === 'offering' ? user.full_name : skill.user_name,
        message: requestMessage,
        exchange_offer: exchangeOffer,
        status: 'pending',
      });
    },
    onSuccess: () => {
      toast.success('Exchange request sent!');
      setShowRequestDialog(false);
      setRequestMessage('');
      setExchangeOffer('');
      setLoading(false);
    },
    onError: () => {
      toast.error('Failed to send request');
      setLoading(false);
    }
  });

  const handleRequestExchange = () => {
    if (!user) {
      auth.redirectToLogin();
      return;
    }
    setShowRequestDialog(true);
  };

  const submitRequest = () => {
    setLoading(true);
    requestMutation.mutate();
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setLoading(true);
    
    await Report.create({
      reporter_id: user.id,
      reporter_name: user.full_name,
      reported_user_id: skill.user_id,
      reported_user_name: skill.user_name,
      reported_content_type: 'skill',
      reported_content_id: skill.id,
      reason: 'other',
      description: reportReason,
      status: 'pending',
    });
    
    toast.success('Report submitted');
    setShowReportDialog(false);
    setReportReason('');
    setLoading(false);
  };

  const handleBlock = async () => {
    if (!user) return;
    
    const blockedUsers = user.blocked_users || [];
    if (!blockedUsers.includes(skill.user_id)) {
      await auth.updateMe({
        blocked_users: [...blockedUsers, skill.user_id]
      });
      toast.success('User blocked');
    }
  };

  if (skillLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Skill not found</h2>
        <Link to={createPageUrl('Explore')}>
          <Button>Back to Explore</Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === skill.user_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Seo
        title={skill.title}
        path={`/SkillDetail?id=${skill.id}`}
        description={`${skill.title} — a ${skill.type} on Neighbourly Exchange in ${skill.location?.city || 'your area'}.`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Service',
              name: skill.title,
              description: skill.description,
              areaServed: skill.location?.city,
              provider: { '@type': 'Person', name: skill.user_name },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Explore', item: `${SITE_URL}/Explore` },
                { '@type': 'ListItem', position: 3, name: skill.title, item: `${SITE_URL}/SkillDetail?id=${skill.id}` },
              ],
            },
          ],
        }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={createPageUrl('Explore')}>Explore</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{skill.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Button
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden border-slate-100">
                {/* Header Bar */}
                <div className={`h-2 ${
                  skill.type === 'offering' 
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                }`} />

                <CardContent className="p-6 sm:p-8">
                  {/* Category & Type */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{categoryIcons[skill.category]}</span>
                      <Badge variant="outline" className="font-medium">
                        {skill.category?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Badge className={`${
                      skill.type === 'offering' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {skill.type === 'offering' ? 'Offering' : 'Requesting'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                    {skill.title}
                  </h1>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6">
                    {skill.location?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {skill.location.city}
                      </span>
                    )}
                    {skill.availability && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {skill.availability}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {skill.views || 0} views
                    </span>
                  </div>

                  {/* Description */}
                  <div className="prose prose-slate max-w-none mb-6">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {skill.description}
                    </p>
                  </div>

                  {/* Exchange For */}
                  {skill.exchange_for && (
                    <div className="p-4 bg-amber-50 rounded-xl mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-800">Looking for in exchange:</span>
                      </div>
                      <p className="text-amber-700">{skill.exchange_for}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100">
                    {!isOwner && (
                      <Button 
                        onClick={handleRequestExchange}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {skill.type === 'offering' ? 'Request This Skill' : 'Offer to Help'}
                      </Button>
                    )}
                    
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>

                    {!isOwner && user && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                            <Flag className="w-4 h-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                            <UserMinus className="w-4 h-4 mr-2" />
                            Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg">
                      <AvatarImage src={skill.user_avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                        {skill.user_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-slate-800">
                          {skill.user_name}
                        </h3>
                        {skill.is_verified_user && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      {skillOwner?.location?.city && (
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {skillOwner.location.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800">
                        {skillOwner?.total_exchanges || 0}
                      </div>
                      <div className="text-xs text-slate-500">Exchanges</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800 flex items-center justify-center gap-1">
                        {Number(skillOwner?.rating_avg ?? 0).toFixed(1)}
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                      <div className="text-xs text-slate-500">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-slate-800">
                        {skillOwner?.rating_count || 0}
                      </div>
                      <div className="text-xs text-slate-500">Reviews</div>
                    </div>
                  </div>

                  {skillOwner?.bio && (
                    <p className="text-sm text-slate-600">{skillOwner.bio}</p>
                  )}

                  <Link to={createPageUrl(`UserProfile?id=${skill.user_id}`)}>
                    <Button variant="outline" className="w-full mt-4">
                      View Full Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews Preview */}
            {ownerReviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-slate-100">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Recent Reviews</h3>
                    <div className="space-y-4">
                      {ownerReviews.slice(0, 2).map((review, index) => (
                        <div key={review.id} className={index > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-slate-500">{review.reviewer_name}</span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {skill.type === 'offering' ? 'Request This Skill' : 'Offer to Help'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Your Message</Label>
                <Textarea
                  placeholder="Introduce yourself and explain what you need..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>What can you offer in exchange?</Label>
                <Input
                  placeholder="e.g., Cooking lessons, tech support, etc."
                  value={exchangeOffer}
                  onChange={(e) => setExchangeOffer(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={submitRequest}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Report This Skill
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label>Reason for reporting</Label>
                <Textarea
                  placeholder="Please explain why you're reporting this..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowReportDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleReport}
                  disabled={loading || !reportReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}