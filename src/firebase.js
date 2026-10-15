import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, runTransaction, get, push, set } from "firebase/database";

// Configuration: Replace with your Firebase project keys from console.firebase.google.com
// You can either put them directly here or in a .env file as VITE_FIREBASE_* variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if valid Firebase configuration is present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && (firebaseConfig.databaseURL || firebaseConfig.projectId)
);

let app = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (err) {
    console.warn("Firebase initialization skipped:", err);
  }
}

/**
 * Subscribes to live hearts for a story.
 * If Firebase is configured, uses WebSockets for instant global live sync.
 * If not, falls back to a public count endpoint or local storage.
 */
export function subscribeToStoryHearts(storySlug, onCountUpdate) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const channelName = `story_hearts_${safeSlug}`;

  // 1. Cross-window / cross-tab instant broadcast listener
  let bc = null;
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(channelName);
      bc.onmessage = (event) => {
        if (event && event.data && typeof event.data.count === 'number') {
          onCountUpdate(event.data.count);
        }
      };
    } catch (e) {}
  }

  // 2. Storage event fallback for older or sandboxed tabs
  const handleStorage = (e) => {
    if (e.key === `hearts_${safeSlug}` && e.newValue != null) {
      const parsed = parseInt(e.newValue, 10);
      if (!isNaN(parsed)) onCountUpdate(parsed);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 3. Global real-time Firebase WebSockets
  let firebaseUnsubscribe = null;
  if (isFirebaseConfigured && db) {
    try {
      const heartsRef = ref(db, `hearts/${safeSlug}`);
      firebaseUnsubscribe = onValue(heartsRef, (snapshot) => {
        const val = snapshot.val();
        let count = 0;
        if (typeof val === 'number') {
          count = val;
        } else if (val && typeof val.count === 'number') {
          count = val.count;
        }
        try {
          localStorage.setItem(`hearts_${safeSlug}`, count.toString());
        } catch (e) {}
        onCountUpdate(count);
      });
    } catch (e) {
      console.warn("Firebase subscription error:", e);
    }
  } else {
    // Local storage fallback when Firebase is not active
    const localHearts = parseInt(localStorage.getItem(`hearts_${safeSlug}`) || (safeSlug === 'her' ? '42' : '0'), 10);
    onCountUpdate(localHearts);
  }

  return () => {
    if (typeof firebaseUnsubscribe === 'function') firebaseUnsubscribe();
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Increments the global heart count for a story.
 */
export async function incrementStoryHearts(storySlug) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  let updatedCount = null;

  if (isFirebaseConfigured && db) {
    try {
      const heartsRef = ref(db, `hearts/${safeSlug}`);
      const result = await runTransaction(heartsRef, (currentCount) => {
        return (Number.isInteger(currentCount) ? currentCount : 0) + 1;
      });
      if (result && result.snapshot) {
        updatedCount = result.snapshot.val();
      }
    } catch (e) {
      console.warn("Firebase increment error:", e);
    }
  }

  if (typeof updatedCount !== 'number') {
    const current = parseInt(localStorage.getItem(`hearts_${safeSlug}`) || (safeSlug === 'her' ? '42' : '0'), 10);
    updatedCount = current + 1;
  }

  // Persist locally
  try {
    localStorage.setItem(`hearts_${safeSlug}`, updatedCount.toString());
  } catch (e) {}

  // Broadcast instantly to all other open tabs/windows
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(`story_hearts_${safeSlug}`);
      bc.postMessage({ count: updatedCount });
      setTimeout(() => {
        try { bc.close(); } catch (e) {}
      }, 200);
    } catch (e) {}
  }

  return updatedCount;
}

/**
 * Subscribes to real-time comments for a story.
 * Works seamlessly from static GitHub Pages using Firebase client SDK.
 */
export function subscribeToStoryComments(storySlug, onCommentsUpdate) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const localKey = `comments_${safeSlug}`;

  const loadLocalComments = () => {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Filter out any mock/sample comments
        return Array.isArray(parsed)
          ? parsed.filter(c => c.id !== 'welcome_1' && c.name !== 'Fellow Wanderer')
          : [];
      }
    } catch (e) {}
    return [];
  };

  if (isFirebaseConfigured && db) {
    try {
      const commentsRef = ref(db, `comments/${safeSlug}`);
      const unsubscribe = onValue(
        commentsRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val && typeof val === 'object') {
            const list = Object.entries(val).map(([id, data]) => ({
              id,
              name: data.name || 'Anonymous Reader',
              text: data.text || '',
              timestamp: data.timestamp || Date.now(),
              likes: typeof data.likes === 'number' ? data.likes : 0,
              hidden: Boolean(data.hidden),
              isAuthor: Boolean(data.isAuthor),
              replies: data.replies && typeof data.replies === 'object'
                ? Object.entries(data.replies).map(([rId, rData]) => ({
                    id: rId,
                    name: rData.name || 'Vishesh Kumar Singh',
                    text: rData.text || '',
                    timestamp: rData.timestamp || Date.now(),
                    isAuthor: rData.isAuthor !== false
                  })).sort((a, b) => a.timestamp - b.timestamp)
                : []
            }));
            list.sort((a, b) => b.timestamp - a.timestamp);
            try {
              localStorage.setItem(localKey, JSON.stringify(list));
            } catch (e) {}
            onCommentsUpdate(list);
          } else {
            // Firebase explicitly confirmed no comments exist for this story
            try {
              localStorage.removeItem(localKey);
            } catch (e) {}
            onCommentsUpdate([]);
          }
        },
        (error) => {
          console.warn("Firebase comments read error (check Database Rules):", error.message);
          onCommentsUpdate(loadLocalComments());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn("Firebase comments subscription error:", e);
    }
  }

  onCommentsUpdate(loadLocalComments());
  return () => {};
}

/**
 * Posts a new comment to Firebase Realtime Database.
 */
export async function postStoryComment(storySlug, { name, text, isAuthor = false }) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const comment = {
    name: (name && name.trim()) ? name.trim() : (isAuthor ? 'Vishesh Kumar Singh' : 'Anonymous Reader'),
    text: text.trim(),
    timestamp: Date.now(),
    likes: 0,
    isAuthor: Boolean(isAuthor),
    hidden: false
  };

  const localKey = `comments_${safeSlug}`;
  let localList = [];
  try {
    localList = JSON.parse(localStorage.getItem(localKey) || '[]');
  } catch (e) {}

  let createdId = `local_${Date.now()}`;

  if (isFirebaseConfigured && db) {
    try {
      const commentsRef = ref(db, `comments/${safeSlug}`);
      const newCommentRef = push(commentsRef);
      createdId = newCommentRef.key;
      await set(newCommentRef, comment);
    } catch (e) {
      console.warn("Firebase postComment error (check Database Rules):", e.message);
    }
  }

  const newComment = { id: createdId, ...comment };
  const updatedLocal = [newComment, ...localList.filter(c => c.id !== createdId)];
  try {
    localStorage.setItem(localKey, JSON.stringify(updatedLocal));
  } catch (e) {}

  return newComment;
}

/**
 * Posts an author reply to an existing comment.
 */
export async function postStoryReply(storySlug, commentId, { name = 'Vishesh Kumar Singh', text, isAuthor = true }) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const reply = {
    name: name.trim() || 'Vishesh Kumar Singh',
    text: text.trim(),
    timestamp: Date.now(),
    isAuthor: Boolean(isAuthor)
  };

  let createdId = `reply_${Date.now()}`;

  if (isFirebaseConfigured && db) {
    try {
      const repliesRef = ref(db, `comments/${safeSlug}/${commentId}/replies`);
      const newReplyRef = push(repliesRef);
      createdId = newReplyRef.key;
      await set(newReplyRef, reply);
    } catch (e) {
      console.warn("Firebase postStoryReply error:", e.message);
    }
  }

  // Local storage fallback
  const localKey = `comments_${safeSlug}`;
  try {
    const current = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = current.map(c => {
      if (c.id === commentId) {
        const existingReplies = c.replies || [];
        return {
          ...c,
          replies: [...existingReplies, { id: createdId, ...reply }]
        };
      }
      return c;
    });
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (e) {}

  return { id: createdId, ...reply };
}

/**
 * Toggles the hidden status of a comment (Author Moderation).
 */
export async function toggleHideComment(storySlug, commentId, hiddenState) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  if (isFirebaseConfigured && db) {
    try {
      const hideRef = ref(db, `comments/${safeSlug}/${commentId}/hidden`);
      await set(hideRef, Boolean(hiddenState));
    } catch (e) {
      console.warn("Firebase toggleHide error:", e.message);
    }
  }

  const localKey = `comments_${safeSlug}`;
  try {
    const current = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = current.map(c => {
      if (c.id === commentId) {
        return { ...c, hidden: Boolean(hiddenState) };
      }
      return c;
    });
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (e) {}

  return true;
}

/**
 * Likes a comment in Firebase Realtime Database.
 */
export async function likeStoryComment(storySlug, commentId) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  if (isFirebaseConfigured && db) {
    try {
      const commentLikesRef = ref(db, `comments/${safeSlug}/${commentId}/likes`);
      const result = await runTransaction(commentLikesRef, (currentLikes) => {
        return (Number.isInteger(currentLikes) ? currentLikes : 0) + 1;
      });
      return result.snapshot.val();
    } catch (e) {
      console.warn("Firebase likeComment error:", e);
    }
  }

  // Local fallback
  const localKey = `comments_${safeSlug}`;
  try {
    const current = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = current.map(c => {
      if (c.id === commentId) {
        return { ...c, likes: (c.likes || 0) + 1 };
      }
      return c;
    });
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (e) {}
  return true;
}

/**
 * Deletes a comment from Firebase Realtime Database and local storage.
 */
export async function deleteStoryComment(storySlug, commentId) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  if (isFirebaseConfigured && db) {
    try {
      const commentRef = ref(db, `comments/${safeSlug}/${commentId}`);
      await set(commentRef, null);
    } catch (e) {
      console.warn("Firebase deleteComment error:", e);
    }
  }

  const localKey = `comments_${safeSlug}`;
  try {
    const current = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = current.filter(c => c.id !== commentId);
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (e) {}
  return true;
}

/**
 * Deletes a reply under a comment.
 */
export async function deleteStoryReply(storySlug, commentId, replyId) {
  const safeSlug = storySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  if (isFirebaseConfigured && db) {
    try {
      const replyRef = ref(db, `comments/${safeSlug}/${commentId}/replies/${replyId}`);
      await set(replyRef, null);
    } catch (e) {
      console.warn("Firebase deleteStoryReply error:", e);
    }
  }

  const localKey = `comments_${safeSlug}`;
  try {
    const current = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = current.map(c => {
      if (c.id === commentId) {
        const filteredReplies = (c.replies || []).filter(r => r.id !== replyId);
        return { ...c, replies: filteredReplies };
      }
      return c;
    });
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (e) {}
  return true;
}

/**
 * Fetches all comments across all stories for Admin Dashboard overview.
 */
export async function fetchAllStoriesComments() {
  if (isFirebaseConfigured && db) {
    try {
      const commentsRef = ref(db, 'comments');
      const snapshot = await get(commentsRef);
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        return val;
      }
    } catch (e) {
      console.warn("Firebase fetchAllStoriesComments error:", e.message);
    }
  }
  return {};
}

