import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Skill } from '@/api/entities';
import { auth } from '@/api/auth';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, ArrowRight, Users, Shield, Star, MapPin, 
  Sparkles, Heart, HandHeart, ArrowRightLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import SkillCard from '../components/skills/SkillCard';
import Seo from '@/components/Seo';
import { SITE_URL } from '@/lib/siteUrl';

const featuredCategories = [
  { value: 'home_repairs', label: 'Home Repairs', icon: '🔧', color: 'from-orange-400 to-red-500' },
  { value: 'technology', label: 'Technology', icon: '💻', color: 'from-blue-400 to-indigo-500' },
  { value: 'gardening', label: 'Gardening', icon: '🌱', color: 'from-green-400 to-emerald-500' },
  { value: 'cooking', label: 'Cooking', icon: '🍳', color: 'from-amber-400 to-orange-500' },
  { value: 'teaching', label: 'Teaching', icon: '📚', color: 'from-purple-400 to-violet-500' },
  { value: 'pet_care', label: 'Pet Care', icon: '🐾', color: 'from-pink-400 to-rose-500' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: recentSkills = [], isLoading } = useQuery({
    queryKey: ['recentSkills'],
    queryFn: () => Skill.filter({ status: 'active' }, '-created_date', 6),
  });

  const { data: stats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_stats');
      if (error) throw error;
      return data;
    },
  });

  const statsDisplay = [
    { label: 'Neighbors', value: stats?.members ?? '—', icon: Users },
    { label: 'Skills Exchanged', value: stats?.exchanges ?? '—', icon: ArrowRightLeft },
    { label: 'Verified Members', value: stats?.verified ?? '—', icon: Shield },
    { label: 'Average Rating', value: stats?.avg_rating || '—', icon: Star },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl(`Explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Seo
        path="/"
        description="Neighborly Exchange connects you with neighbors to swap skills, services, and favors — no money needed. Verified members, tracked exchanges, honest reviews."
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', name: 'Neighborly Exchange', url: SITE_URL },
            { '@type': 'WebSite', name: 'Neighborly Exchange', url: SITE_URL },
          ],
        }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMGI5OGEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-emerald-100 text-emerald-700 mb-6 px-4 py-1.5 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                No Money Needed • Just Skills & Kindness
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Exchange Skills with
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Your Neighbors</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                Connect with people in your neighborhood to share skills, services, and favors. 
                Build a stronger community through mutual help.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto mb-10"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="What skill do you need? e.g., plumbing, tutoring, cooking..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 text-lg rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <Button 
                    type="submit"
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to={createPageUrl('Explore')}>
                <Button size="lg" variant="outline" className="h-12 px-6 rounded-xl border-2 hover:bg-slate-50">
                  Browse All Skills
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {!user && (
                <Button 
                  size="lg" 
                  onClick={() => auth.redirectToLogin()}
                  className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800"
                >
                  Join the Community
                  <Heart className="w-4 h-4 ml-2" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statsDisplay.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Find the help you need or offer your skills in these popular categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCategories.map((cat, index) => (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl(`Explore?category=${cat.value}`)}>
                  <Card className="group hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 border-slate-100 hover:border-emerald-200 cursor-pointer h-full overflow-hidden">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        {cat.icon}
                      </div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {cat.label}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to={createPageUrl('Explore')}>
              <Button variant="outline" className="rounded-full px-6">
                View All Categories
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Skills Section */}
      <section className="py-16 lg:py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Recently Posted
              </h2>
              <p className="text-lg text-slate-600">
                Fresh opportunities from your community
              </p>
            </div>
            <Link to={createPageUrl('Explore')}>
              <Button variant="outline" className="hidden sm:flex items-center gap-2 rounded-full">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-2 bg-slate-200 rounded mb-4" />
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                    <div className="h-20 bg-slate-100 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSkills.map((skill, index) => (
                <SkillCard key={skill.id} skill={skill} index={index} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link to={createPageUrl('Explore')}>
              <Button variant="outline" className="rounded-full px-6">
                View All Skills
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start exchanging skills in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Post Your Skill',
                description: 'Share what you can offer or what help you need. Be specific about your availability.',
                icon: HandHeart,
                color: 'bg-emerald-500'
              },
              {
                step: '02',
                title: 'Connect Locally',
                description: 'Find neighbors within 5 miles who match your needs. Check their reviews and verification status.',
                icon: MapPin,
                color: 'bg-teal-500'
              },
              {
                step: '03',
                title: 'Exchange & Review',
                description: 'Complete the exchange and leave a review. Build your reputation in the community.',
                icon: Star,
                color: 'bg-amber-500'
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${item.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-5xl font-bold text-slate-100 absolute top-0 right-4 -z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-emerald-600 to-teal-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Ready to Join Your Community?
              </h2>
              <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
                Start exchanging skills with neighbors today. It's free, safe, and helps build a stronger community.
              </p>
              <Button 
                size="lg" 
                onClick={() => auth.redirectToLogin()}
                className="h-14 px-8 text-lg rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}