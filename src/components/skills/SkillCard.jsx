import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star, Clock, Eye, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryIcons = {
  home_repairs: '🔧',
  technology: '💻',
  teaching: '📚',
  gardening: '🌱',
  cooking: '🍳',
  transportation: '🚗',
  pet_care: '🐾',
  childcare: '👶',
  fitness: '💪',
  arts_crafts: '🎨',
  music: '🎵',
  languages: '🌍',
  cleaning: '🧹',
  moving: '📦',
  other: '✨'
};

const categoryColors = {
  home_repairs: 'bg-orange-50 text-orange-700 border-orange-200',
  technology: 'bg-blue-50 text-blue-700 border-blue-200',
  teaching: 'bg-purple-50 text-purple-700 border-purple-200',
  gardening: 'bg-green-50 text-green-700 border-green-200',
  cooking: 'bg-red-50 text-red-700 border-red-200',
  transportation: 'bg-slate-50 text-slate-700 border-slate-200',
  pet_care: 'bg-amber-50 text-amber-700 border-amber-200',
  childcare: 'bg-pink-50 text-pink-700 border-pink-200',
  fitness: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  arts_crafts: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  music: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  languages: 'bg-teal-50 text-teal-700 border-teal-200',
  cleaning: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  moving: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function SkillCard({ skill, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={createPageUrl(`SkillDetail?id=${skill.id}`)}>
        <Card className="group overflow-hidden hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 border-slate-100 hover:border-emerald-200 cursor-pointer h-full">
          <CardContent className="p-0">
            {/* Header with gradient */}
            <div className={`h-2 ${skill.type === 'offering' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
            
            <div className="p-5">
              {/* Category & Type Badge */}
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className={`${categoryColors[skill.category]} border font-medium`}>
                  <span className="mr-1">{categoryIcons[skill.category]}</span>
                  {skill.category?.replace('_', ' ')}
                </Badge>
                <Badge className={`${skill.type === 'offering' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {skill.type === 'offering' ? 'Offering' : 'Requesting'}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-lg text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {skill.title}
              </h3>

              {/* Description */}
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                {skill.description}
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <Avatar className="w-10 h-10 ring-2 ring-white shadow">
                  <AvatarImage src={skill.user_avatar} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                    {skill.user_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700 truncate">{skill.user_name}</span>
                    {skill.is_verified_user && (
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  {skill.location?.city && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {skill.location.city}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  {skill.availability && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {skill.availability}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {skill.views || 0} views
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}