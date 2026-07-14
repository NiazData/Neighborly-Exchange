import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function ReviewCard({ review, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-slate-100">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {review.reviewer_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">{review.reviewer_name}</span>
                <div className="flex items-center gap-1">
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
              </div>
              
              <p className="text-slate-600 text-sm mb-3">{review.comment}</p>
              
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {review.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-slate-400">
                {format(new Date(review.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}