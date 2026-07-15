import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Skill } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SkillCard from '../components/skills/SkillCard';
import CategoryFilter from '../components/skills/CategoryFilter';

export default function Explore() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  
  const [searchQuery, setSearchQuery] = useState(params.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(params.get('category') || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: skills = [], isLoading, refetch } = useQuery({
    queryKey: ['skills', selectedCategory, selectedType, searchQuery],
    queryFn: async () => {
      let filter = { status: 'active' };
      if (selectedCategory !== 'all') filter.category = selectedCategory;
      if (selectedType !== 'all') filter.type = selectedType;
      
      const results = await Skill.filter(filter, '-created_date', 50);
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return results.filter(skill => 
          skill.title?.toLowerCase().includes(query) ||
          skill.description?.toLowerCase().includes(query)
        );
      }
      return results;
    },
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedType !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Explore Skills
          </h1>
          <p className="text-lg text-slate-600">
            Discover what your neighbors can offer or find help you need
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg rounded-xl border-slate-200"
              />
            </div>
            <Button
              variant="outline"
              className="h-12 px-4 rounded-xl lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 h-11 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="requesting">Requesting</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Mobile Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden space-y-4 overflow-hidden"
              >
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full h-11 rounded-lg">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="offering">Offering</SelectItem>
                    <SelectItem value="requesting">Requesting</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Filter */}
          <CategoryFilter 
            selected={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">{skills.length}</span> skills found
          </p>
          {hasActiveFilters && (
            <div className="flex gap-2 flex-wrap">
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {selectedCategory.replace('_', ' ')}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1.5 hover:text-emerald-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedType !== 'all' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {selectedType}
                  <button 
                    onClick={() => setSelectedType('all')}
                    className="ml-1.5 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
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
        ) : skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <SkillCard key={skill.id} skill={skill} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No skills found</h3>
            <p className="text-slate-500 mb-6">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}