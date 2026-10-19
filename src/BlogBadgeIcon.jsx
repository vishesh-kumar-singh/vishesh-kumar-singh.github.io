import React from 'react';
import { Compass, Sparkles, Heart, BookOpen, Cpu } from 'lucide-react';
import { getBadgeIconType } from './blogThemes.js';

export function BlogBadgeIcon({ badge = '', theme = null, className = 'w-3.5 h-3.5' }) {
  const iconType = getBadgeIconType(badge, theme?.type);

  switch (iconType) {
    case 'compass':
      return <Compass className={`${className} text-cyan-400`} />;
    case 'sparkles':
      return <Sparkles className={`${className} ${theme?.heart || 'text-amber-400 fill-amber-500/40'}`} />;
    case 'book':
      return <BookOpen className={`${className} text-emerald-400`} />;
    case 'cpu':
      return <Cpu className={`${className} text-violet-400`} />;
    case 'heart':
    default:
      return <Heart className={`${className} ${theme?.heart || 'text-rose-400 fill-rose-500/50'}`} />;
  }
}

export default BlogBadgeIcon;
