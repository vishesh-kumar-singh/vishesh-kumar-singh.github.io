import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Sparkles, Heart, Search, BookOpen, 
  ChevronRight, X, Compass, Feather, Library
} from 'lucide-react';
import { getAllBlogs } from './blogUtils.js';
import { getBlogCardTheme } from './blogThemes.js';
import { renderInlineMarkdown } from './renderInlineMarkdown.jsx';

export default function BlogsUniversePage({ onBack, onOpenStory }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const blogs = useMemo(() => {
    return getAllBlogs();
  }, []);

  // Collect all unique tags across all published blogs
  const allTags = useMemo(() => {
    const tagSet = new Set();
    blogs.forEach(blog => {
      if (Array.isArray(blog.metadata.tags)) {
        blog.metadata.tags.forEach(t => tagSet.add(t));
      }
    });
    return ['All', ...Array.from(tagSet)];
  }, [blogs]);

  // Filter blogs based on active tag and search query
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesTag = 
        selectedTag === 'All' || 
        (blog.metadata.tags && blog.metadata.tags.includes(selectedTag));

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        blog.metadata.title?.toLowerCase().includes(query) ||
        blog.metadata.subtitle?.toLowerCase().includes(query) ||
        blog.metadata.description?.toLowerCase().includes(query) ||
        (blog.metadata.tags && blog.metadata.tags.some(t => t.toLowerCase().includes(query)));

      return matchesTag && matchesSearch;
    });
  }, [blogs, selectedTag, searchQuery]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      
      {/* 1. Ambient Cosmic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-purple-900/20 via-rose-900/10 to-transparent rounded-full blur-[150px] opacity-70" />
        <div className="absolute top-[35%] -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[65%] -right-40 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[140px]" />
      </div>

      {/* 2. Sticky Glass Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-black/40 border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white transition-all group"
            title="Return to Main Universe"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Main Universe</span>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10 text-xs text-slate-400 font-mono">
            <Library className="w-3.5 h-3.5 text-purple-400" />
            <span>Writings Constellation</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-purple-300">
            {blogs.length} {blogs.length === 1 ? 'Story' : 'Stories'} Archived
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-16 pb-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border border-rose-500/30 bg-rose-500/10 text-rose-300 mb-6 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>The Writings Constellation</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black font-serif text-white tracking-tight mb-6"
          >
            The Universe of Stories
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-400 font-serif italic leading-relaxed"
          >
            "A personal constellation of memories, unhurried reflections, late-night phone calls, and unfiltered words."
          </motion.p>
        </div>

        {/* 4. Search and Filter Bar */}
        <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Tag Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
                  selectedTag === tag
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                {tag === 'All' ? 'All Stories' : `#${tag}`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories..."
              className="w-full pl-10 pr-9 py-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:bg-white/10 text-white placeholder-slate-500 text-xs font-mono outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5. Stories Grid */}
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md">
            <Compass className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-spin" style={{ animationDuration: '10s' }} />
            <h3 className="text-xl font-serif font-bold text-white mb-2">No Stories Found</h3>
            <p className="text-sm font-serif italic text-slate-400 max-w-sm mx-auto">
              No memoirs in this constellation match your search. Try another tag or clear your query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence>
              {filteredBlogs.map((blog, idx) => {
                const theme = getBlogCardTheme(blog.metadata.badge, blog.metadata.tags, blog.metadata.theme);
                return (
                  <motion.div
                    key={blog.slug}
                    layout
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className={`group relative rounded-3xl p-1 bg-gradient-to-r ${theme.border} transition-all duration-500 ${theme.shadow} flex flex-col justify-between`}
                  >
                    <div className="relative h-full rounded-[22px] bg-[#0c0d14]/90 backdrop-blur-xl p-8 sm:p-10 overflow-hidden flex flex-col justify-between">
                      
                      {/* Subtle Ambient Glow inside Card */}
                      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${theme.glow}`} />
                      
                      <div>
                        {/* Top Bar: Date & Read Time on Left, Badge on Right with Heart */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            {blog.metadata.date && (
                              <span className="text-slate-300 font-medium">
                                {blog.metadata.date}
                              </span>
                            )}
                            <span>• ~{blog.readTimeMinutes} min read</span>
                          </div>

                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border font-bold ${theme.badge}`}>
                            <Heart className={`w-3.5 h-3.5 ${theme.heart}`} />
                            <span>{blog.metadata.badge || 'Personal Memoir'}</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-3xl sm:text-5xl font-black font-serif text-white tracking-tight mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all ${theme.titleHover}`}>
                          {renderInlineMarkdown(blog.metadata.title)}
                        </h3>

                        {/* Description */}
                        {blog.metadata.description && (
                          <p className="text-sm sm:text-base text-slate-300 font-serif leading-relaxed mb-6 italic line-clamp-4">
                            "{renderInlineMarkdown(blog.metadata.description)}"
                          </p>
                        )}

                        {/* Tags */}
                        {blog.metadata.tags && blog.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-8">
                            {blog.metadata.tags.map((tag, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10 mt-auto">
                        <div className="flex items-center gap-3">
                          <img src="/image.jpg" alt="Vishesh" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                          <div className="text-left text-xs">
                            <div className="text-white font-semibold font-mono">Vishesh Kumar Singh</div>
                            {blog.metadata.subtitle && (
                              <div className={`font-serif italic text-xs ${theme.subtitle} truncate max-w-[220px]`}>
                                {blog.metadata.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenStory(blog.slug)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${theme.button} text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition-all transform group-hover:scale-105 active:scale-95 cursor-pointer`}
                        >
                          <span>Read Story</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </main>

    </div>
  );
}
