import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const categories = [
  { value: 'all', label: 'All', icon: '✨' },
  { value: 'home_repairs', label: 'Home Repairs', icon: '🔧' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'teaching', label: 'Teaching', icon: '📚' },
  { value: 'gardening', label: 'Gardening', icon: '🌱' },
  { value: 'cooking', label: 'Cooking', icon: '🍳' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'pet_care', label: 'Pet Care', icon: '🐾' },
  { value: 'childcare', label: 'Childcare', icon: '👶' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'arts_crafts', label: 'Arts & Crafts', icon: '🎨' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'languages', label: 'Languages', icon: '🌍' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'moving', label: 'Moving Help', icon: '📦' },
  { value: 'other', label: 'Other', icon: '🔮' },
];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 p-1">
        {categories.map((cat) => (
          <motion.div
            key={cat.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={selected === cat.value ? 'default' : 'outline'}
              className={`flex items-center gap-2 rounded-full px-4 transition-all ${
                selected === cat.value 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' 
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
              onClick={() => onSelect(cat.value)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { categories };