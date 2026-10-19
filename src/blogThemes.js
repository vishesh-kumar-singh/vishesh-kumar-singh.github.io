// Badge Theme Palette Engine
// Determines card aesthetic based primarily on the frontmatter `badge`.
// Tags are only used as a secondary fallback if no recognized badge is found.

export const BADGE_PALETTES = {
  // 1. Philosophy / Midnight Thoughts / Solitude (Cyan & Indigo Depth)
  indigo: {
    type: 'indigo',
    name: 'Philosophy & Solitude',
    border: 'from-cyan-500/40 via-blue-500/30 to-indigo-500/20 hover:from-cyan-500/70 hover:via-blue-500/60 hover:to-indigo-500/50',
    shadow: 'shadow-[0_0_35px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.35)]',
    glow: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
    badge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    heart: 'text-cyan-400 fill-cyan-500/50',
    titleHover: 'group-hover:from-white group-hover:via-cyan-100 group-hover:to-blue-200',
    subtitle: 'text-cyan-200/80',
    button: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25',
  },

  // 2. Personal Memoir / Love / Romance / Letters (Rose Pink & Magenta)
  rose: {
    type: 'rose',
    name: 'Personal Memoir & Romance',
    border: 'from-rose-500/40 via-purple-500/30 to-amber-500/20 hover:from-rose-500/70 hover:via-purple-500/60 hover:to-amber-500/50',
    shadow: 'shadow-[0_0_35px_rgba(244,63,94,0.15)] hover:shadow-[0_0_50px_rgba(244,63,94,0.35)]',
    glow: 'bg-rose-500/10 group-hover:bg-rose-500/20',
    badge: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    heart: 'text-rose-400 fill-rose-500/50',
    titleHover: 'group-hover:from-white group-hover:via-rose-100 group-hover:to-purple-200',
    subtitle: 'text-rose-200/80',
    button: 'from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 shadow-rose-500/25',
  },

  // 3. Childhood / Nostalgia / Innocence (Golden Amber Warmth)
  amber: {
    type: 'amber',
    name: 'Childhood & Nostalgia',
    border: 'from-amber-500/40 via-orange-500/30 to-yellow-500/20 hover:from-amber-500/70 hover:via-orange-500/60 hover:to-yellow-500/50',
    shadow: 'shadow-[0_0_35px_rgba(245,158,11,0.15)] hover:shadow-[0_0_50px_rgba(245,158,11,0.35)]',
    glow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    heart: 'text-amber-400 fill-amber-500/50',
    titleHover: 'group-hover:from-white group-hover:via-amber-100 group-hover:to-orange-200',
    subtitle: 'text-amber-200/80',
    button: 'from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25',
  },

  // 4. Campus / College / Chronicles / Adventures (Emerald & Teal Energy)
  emerald: {
    type: 'emerald',
    name: 'Campus Chronicles & Journeys',
    border: 'from-emerald-500/40 via-teal-500/30 to-cyan-500/20 hover:from-emerald-500/70 hover:via-teal-500/60 hover:to-cyan-500/50',
    shadow: 'shadow-[0_0_35px_rgba(16,185,129,0.15)] hover:shadow-[0_0_50px_rgba(16,185,129,0.35)]',
    glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    heart: 'text-emerald-400 fill-emerald-500/50',
    titleHover: 'group-hover:from-white group-hover:via-emerald-100 group-hover:to-teal-200',
    subtitle: 'text-emerald-200/80',
    button: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25',
  },

  // 5. Tech / Code / Research / AI (Electric Violet & Blue)
  violet: {
    type: 'violet',
    name: 'Tech & Research',
    border: 'from-violet-500/40 via-purple-500/30 to-indigo-500/20 hover:from-violet-500/70 hover:via-purple-500/60 hover:to-indigo-500/50',
    shadow: 'shadow-[0_0_35px_rgba(139,92,246,0.15)] hover:shadow-[0_0_50px_rgba(139,92,246,0.35)]',
    glow: 'bg-violet-500/10 group-hover:bg-violet-500/20',
    badge: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
    heart: 'text-violet-400 fill-violet-500/50',
    titleHover: 'group-hover:from-white group-hover:via-violet-100 group-hover:to-purple-200',
    subtitle: 'text-violet-200/80',
    button: 'from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 shadow-violet-500/25',
  },
};

// Categorize any text (badge or tags) into a finite palette key
function classifyText(text = '') {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // 0. Direct Theme / Atmosphere Names
  if (lower === 'sepia' || lower === 'amber' || lower === 'warm' || lower === 'vintage' || lower === 'candlelight' || lower === 'nostalgia') {
    return 'amber';
  }
  if (lower === 'rose' || lower === 'pink') {
    return 'rose';
  }
  if (lower === 'midnight' || lower === 'indigo' || lower === 'dark' || lower === 'night') {
    return 'indigo';
  }
  if (lower === 'emerald' || lower === 'teal' || lower === 'green') {
    return 'emerald';
  }
  if (lower === 'violet' || lower === 'purple') {
    return 'violet';
  }

  // 1. Philosophy / Deep Reflections / Midnight Thoughts
  if (
    lower.includes('philosoph') ||
    lower.includes('reflect') ||
    lower.includes('midnight') ||
    lower.includes('solitude') ||
    lower.includes('deep') ||
    lower.includes('rant') ||
    lower.includes('thought') ||
    lower.includes('exist') ||
    lower.includes('mind') ||
    lower.includes('who am i')
  ) {
    return 'indigo';
  }

  // 2. Personal Memoir / Love / Romance / Letters
  if (
    lower.includes('memoir') ||
    lower.includes('love') ||
    lower.includes('romanc') ||
    lower.includes('heart') ||
    lower.includes('letter') ||
    lower.includes('confession') ||
    lower.includes('relationship') ||
    lower.includes('unfiltered')
  ) {
    return 'rose';
  }

  // 3. Childhood / Nostalgia / Innocence
  if (
    lower.includes('child') ||
    lower.includes('nostalg') ||
    lower.includes('innocen') ||
    lower.includes('early') ||
    lower.includes('kid') ||
    lower.includes('village') ||
    lower.includes('growing up') ||
    lower.includes('cow')
  ) {
    return 'amber';
  }

  // 4. Campus / College / Chronicles / Journey / Adventure
  if (
    lower.includes('campus') ||
    lower.includes('college') ||
    lower.includes('journey') ||
    lower.includes('chronicle') ||
    lower.includes('adventure') ||
    lower.includes('travel') ||
    lower.includes('iitk')
  ) {
    return 'emerald';
  }

  // 5. Tech / Code / Research / AI / Robotics
  if (
    lower.includes('tech') ||
    lower.includes('code') ||
    lower.includes('research') ||
    lower.includes('engineer') ||
    lower.includes('robot') ||
    lower.includes('ai')
  ) {
    return 'violet';
  }

  return null;
}

export function getBlogCardTheme(badge = '', tags = [], theme = '') {
  // PRIORITY 0: Explicit frontmatter `theme` if specified
  if (theme && typeof theme === 'string') {
    const themeCategory = classifyText(theme);
    if (themeCategory && BADGE_PALETTES[themeCategory]) {
      return BADGE_PALETTES[themeCategory];
    }
  }

  // PRIORITY 1: The explicit badge is primary and authoritative!
  const badgeCategory = classifyText(badge);
  if (badgeCategory && BADGE_PALETTES[badgeCategory]) {
    return BADGE_PALETTES[badgeCategory];
  }

  // PRIORITY 2: If the badge didn't match, check the tags as fallback
  if (Array.isArray(tags) && tags.length > 0) {
    for (const tag of tags) {
      const tagCategory = classifyText(tag);
      if (tagCategory && BADGE_PALETTES[tagCategory]) {
        return BADGE_PALETTES[tagCategory];
      }
    }
  }

  // PRIORITY 3: Default to Rose (Personal Memoir style)
  return BADGE_PALETTES.rose;
}

export function getBadgeIconType(badge = '', paletteType = '') {
  const lower = (badge || '').toLowerCase();
  if (lower.includes('philo') || lower.includes('mind') || lower.includes('thought') || lower.includes('exist') || paletteType === 'indigo') {
    return 'compass';
  }
  if (lower.includes('child') || lower.includes('nostalg') || lower.includes('innocen') || paletteType === 'amber') {
    return 'sparkles';
  }
  if (lower.includes('memoir') || lower.includes('love') || lower.includes('romanc') || lower.includes('heart') || paletteType === 'rose') {
    return 'heart';
  }
  if (lower.includes('campus') || lower.includes('college') || lower.includes('journey') || paletteType === 'emerald') {
    return 'book';
  }
  if (lower.includes('tech') || lower.includes('code') || lower.includes('research') || lower.includes('ai') || paletteType === 'violet') {
    return 'cpu';
  }
  return 'sparkles';
}
