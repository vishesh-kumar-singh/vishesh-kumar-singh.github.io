import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Unlock, Eye, EyeOff, ArrowLeft, 
  Trash2, EyeOff as HideIcon, MessageSquare, CornerDownRight, 
  Send, RefreshCw, CheckCircle, AlertCircle, Sparkles, 
  Heart, X, Compass, Check
} from 'lucide-react';
import { isAuthorLoggedIn, loginAuthor, logoutAuthor } from './auth.js';
import { 
  fetchAllStoriesComments, deleteStoryComment, 
  toggleHideComment, postStoryReply, deleteStoryReply 
} from './firebase.js';

export default function AdminPage({ onBack }) {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthorLoggedIn());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Comments & Moderation state
  const [allData, setAllData] = useState({});
  const [activeStoryFilter, setActiveStoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState('');



  useEffect(() => {
    const handleAuthChange = () => {
      const logged = isAuthorLoggedIn();
      setIsLoggedIn(logged);
      if (logged) loadComments();
    };
    window.addEventListener('author-auth-change', handleAuthChange);
    return () => window.removeEventListener('author-auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    if (isAuthorLoggedIn()) {
      loadComments();
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllStoriesComments();
      setAllData(data || {});
    } catch (e) {
      console.warn("Failed to load comments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsVerifying(true);
    setLoginError('');

    const res = await loginAuthor(password.trim());
    setIsVerifying(false);

    if (res.success) {
      setIsLoggedIn(true);
      setPassword('');
      loadComments();
      showToast('Welcome, Vishesh. Author mode authenticated.');
    } else {
      setLoginError(res.error || 'Incorrect author password.');
    }
  };

  const handleLogout = () => {
    logoutAuthor();
    setIsLoggedIn(false);
  };

  const handleDelete = async (storySlug, commentId) => {
    if (!window.confirm("Are you sure you want to permanently delete this comment from Firebase?")) return;
    await deleteStoryComment(storySlug, commentId);
    showToast('Comment permanently deleted.');
    loadComments();
  };

  const handleToggleHide = async (storySlug, commentId, currentHidden) => {
    await toggleHideComment(storySlug, commentId, !currentHidden);
    showToast(!currentHidden ? 'Comment hidden from public readers.' : 'Comment restored to public feed.');
    loadComments();
  };

  const handleSendReply = async (storySlug, commentId) => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      await postStoryReply(storySlug, commentId, {
        name: 'Vishesh Kumar Singh',
        text: replyText.trim(),
        isAuthor: true
      });
      setReplyText('');
      setReplyingToId(null);
      showToast('Verified author reply posted!');
      loadComments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (storySlug, commentId, replyId) => {
    if (!window.confirm("Permanently delete this author reply?")) return;
    await deleteStoryReply(storySlug, commentId, replyId);
    showToast('Author reply deleted.');
    loadComments();
  };



  // Flatten comments
  const storiesList = Object.keys(allData);
  let flattenedComments = [];

  Object.entries(allData).forEach(([slug, storyComments]) => {
    if (storyComments && typeof storyComments === 'object') {
      Object.entries(storyComments).forEach(([id, data]) => {
        flattenedComments.push({
          id,
          storySlug: slug,
          name: data.name || 'Anonymous Reader',
          text: data.text || '',
          timestamp: data.timestamp || Date.now(),
          likes: data.likes || 0,
          hidden: Boolean(data.hidden),
          isAuthor: Boolean(data.isAuthor),
          replies: data.replies && typeof data.replies === 'object'
            ? Object.entries(data.replies).map(([rId, r]) => ({ id: rId, ...r }))
            : []
        });
      });
    }
  });

  flattenedComments.sort((a, b) => b.timestamp - a.timestamp);

  const displayedComments = activeStoryFilter === 'all'
    ? flattenedComments
    : flattenedComments.filter(c => c.storySlug.toLowerCase() === activeStoryFilter.toLowerCase());

  const totalHidden = flattenedComments.filter(c => c.hidden).length;
  const totalReplies = flattenedComments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-purple-500 selection:text-white relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoggedIn ? (
        /* Fullscreen Login Page */
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 w-full max-w-md bg-[#0c0d14]/90 border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-2xl text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-6 shadow-inner">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>

            <h1 className="text-3xl font-serif font-black text-white mb-2">
              Author Portal
            </h1>
            <p className="text-sm text-slate-400 font-serif italic mb-8">
              "Enter secret password to moderate reflections and reply directly to readers."
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative text-left">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter author password..."
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-purple-400 focus:outline-none text-white text-sm pr-12 transition-all placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-rose-500 hover:opacity-95 font-bold text-white text-sm transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? "Verifying..." : "Enter Admin Space"}
              </button>
            </form>

            <div className="pt-8 border-t border-white/10 mt-8">
              <button
                onClick={onBack}
                className="text-xs font-mono text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Vishesh Kumar Singh's Page</span>
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Fullscreen Admin Dashboard */
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
          {/* Top Navbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <img
                src="/image.jpg"
                alt="Vishesh"
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-lg"
              />
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Vishesh Kumar Singh</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-500/40 text-purple-300">
                    Author / Moderator
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Personal Universe Moderation Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View Public Site</span>
              </button>



              <button
                onClick={loadComments}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Refresh comments"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-mono text-rose-300 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs font-mono text-slate-400 mb-1">Total Reflections</div>
              <div className="text-3xl font-black text-white">{flattenedComments.length}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs font-mono text-emerald-400 mb-1">Publicly Visible</div>
              <div className="text-3xl font-black text-emerald-300">
                {flattenedComments.length - totalHidden}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs font-mono text-amber-400 mb-1">Hidden / Moderated</div>
              <div className="text-3xl font-black text-amber-300">{totalHidden}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs font-mono text-purple-400 mb-1">Author Replies</div>
              <div className="text-3xl font-black text-purple-300">{totalReplies}</div>
            </div>
          </div>

          {/* Story Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setActiveStoryFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                activeStoryFilter === 'all'
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              All Stories ({flattenedComments.length})
            </button>
            {storiesList.map((slug) => {
              const count = Object.keys(allData[slug] || {}).length;
              return (
                <button
                  key={slug}
                  onClick={() => setActiveStoryFilter(slug)}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase transition-all cursor-pointer ${
                    activeStoryFilter.toLowerCase() === slug.toLowerCase()
                      ? 'bg-purple-500/20 border border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {slug} ({count})
                </button>
              );
            })}
          </div>

          {/* Comments Feed List */}
          {displayedComments.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white/5 border border-white/10 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-serif font-bold text-white mb-1">No Comments Found</h3>
              <p className="text-sm font-serif italic text-slate-400">
                {isLoading ? "Fetching latest comments..." : "No reader reflections under this story."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    comment.hidden
                      ? 'bg-rose-950/10 border-rose-500/40 opacity-80'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white uppercase shadow-md">
                        {comment.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white flex items-center gap-2">
                          <span>{comment.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 uppercase">
                            {comment.storySlug}
                          </span>
                          {comment.hidden ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
                              Hidden from Readers
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                              Public
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Moderation Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>

                      <button
                        onClick={() => handleToggleHide(comment.storySlug, comment.id, comment.hidden)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                          comment.hidden
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                            : 'bg-white/5 hover:bg-white/15 text-slate-300'
                        }`}
                        title={comment.hidden ? "Unhide from public feed" : "Hide from readers"}
                      >
                        {comment.hidden ? <Unlock className="w-3.5 h-3.5" /> : <HideIcon className="w-3.5 h-3.5" />}
                        <span>{comment.hidden ? 'Unhide' : 'Hide'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(comment.storySlug, comment.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-base text-slate-200 font-serif leading-relaxed pl-13 sm:pl-13">
                    "{comment.text}"
                  </p>

                  {/* Existing Author Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-13 space-y-3">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/30 flex items-start justify-between gap-3 shadow-inner"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src="/image.jpg"
                              alt="Author"
                              className="w-7 h-7 rounded-full object-cover border border-purple-400 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                                <span>Vishesh Kumar Singh</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-200">
                                  Author ✦
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  • {new Date(reply.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-serif italic text-white/95 mt-1 leading-relaxed">
                                "{reply.text}"
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteReply(comment.storySlug, comment.id, reply.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                            title="Delete this reply"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {replyingToId === comment.id && (
                    <div className="mt-4 pl-13 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-2 text-xs font-mono text-purple-300">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Replying as Vishesh Kumar Singh (Author)</span>
                      </div>
                      <div className="flex items-end gap-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write reply to reader..."
                          rows={2}
                          autoFocus
                          className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-purple-500/40 focus:border-purple-400 focus:outline-none text-white text-sm placeholder-slate-500"
                        />
                        <button
                          onClick={() => handleSendReply(comment.storySlug, comment.id)}
                          disabled={isSubmittingReply || !replyText.trim()}
                          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingReply ? '...' : 'Send'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


        </div>
      )}
    </div>
  );
}
