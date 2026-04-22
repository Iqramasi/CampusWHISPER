
'use client';

import { useEffect, useState } from 'react';
import {
  getPosts,
  getComments,
  deletePost,
  deleteComment,
} from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function MyActivity() {
  const user = useAuthStore((s) => s.user);

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await getPosts();
      const allPosts = res.data.posts || [];

      // 🔥 My posts
      const myPosts = allPosts.filter(
        (p) => String(p.author_id) === String(user?.id)
      );
      setPosts(myPosts);

      // 🔥 Fetch comments in parallel (FAST)
      const commentResults = await Promise.all(
        allPosts.map((p) =>
          getComments(p.id).catch(() => ({ data: { comments: [] } }))
        )
      );

      const allComments = commentResults.flatMap(
        (c) => c.data.comments || []
      );

      const myComments = allComments.filter(
        (c) => String(c.author_id) === String(user?.id)
      );

      setComments(myComments);
    } catch (err) {
      console.error('MY ACTIVITY ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const handleDeletePost = async (id) => {
    try {
      setDeletingId(id);
      await deletePost(id);

      // 🔥 instant UI update (no reload)
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('DELETE POST ERROR:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      setDeletingId(id);
      await deleteComment(id);

      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('DELETE COMMENT ERROR:', e);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="status-text">Loading your activity...</p>;
  }

  return (
    <div className="panel" style={{ padding: 20 }}>
      <h3>My Posts</h3>

      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((p) => (
          <div key={p.id} className="activity-item">
            <p>{p.content}</p>

            <button
              className="action-btn delete-btn"
              disabled={deletingId === p.id}
              onClick={() => handleDeletePost(p.id)}
            >
              {deletingId === p.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))
      )}

      <h3 style={{ marginTop: 20 }}>My Comments</h3>

      {comments.length === 0 ? (
        <p>No comments yet</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="activity-item">
            <p>{c.content}</p>

            <button
              className="action-btn delete-btn"
              disabled={deletingId === c.id}
              onClick={() => handleDeleteComment(c.id)}
            >
              {deletingId === c.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))
      )}
    </div>
  );
}