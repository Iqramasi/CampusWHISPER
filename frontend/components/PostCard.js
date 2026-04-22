'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getComments, addComment, deleteComment } from '../lib/api'; // ✅ added delete

export default function PostCard({ post, user, onLike }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [anonComment, setAnonComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingCommentSubmit, setLoadingCommentSubmit] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Number(post.likes_count ?? post.likes ?? 0));
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLikeCount(Number(post.likes_count ?? post.likes ?? 0));
    setLiked(Boolean(post.liked_by_me));
  }, [post]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data } = await getComments(post.id);
      setComments(Array.isArray(data) ? data : data?.comments || []);
    } catch (e) {
      console.error('GET COMMENTS ERROR:', e);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) await loadComments();
  };

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    try {
      await onLike?.(post.id, wasLiked);
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    if (!user) {
      setCommentError('Login to comment');
      return;
    }

    setLoadingCommentSubmit(true);
    setCommentError('');

    try {
      const { data } = await addComment(post.id, {
        content: text,
        is_anonymous: anonComment,
      });

      setComments((c) => [...c, data?.comment || data]);
      setCommentText('');
      setAnonComment(false);
    } catch (e) {
      console.error('ADD COMMENT ERROR:', e);
      setCommentError('Failed to add comment');
    } finally {
      setLoadingCommentSubmit(false);
    }
  };

  // 🔥 DELETE COMMENT
  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('DELETE COMMENT ERROR:', e);
    }
  };

  const timeAgo = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : '';

  return (
    <article className="panel post-card">
      <div className="post-header">
        <div className="post-author">
          <div className={`avatar ${post.is_anonymous ? 'anon' : ''}`}>
            {post.is_anonymous ? '👻' : (post.username?.[0] || '?').toUpperCase()}
          </div>

          <div>
            <div className="post-author-name">
              {post.is_anonymous ? 'Anonymous' : post.username}
            </div>
            <div className="post-time">{timeAgo}</div>
          </div>
        </div>

        <div className="post-tags">
          {post.location_tag && <span className="chip chip-cyan">{post.location_tag}</span>}
          {post.college && <span className="chip">{post.college}</span>}
          {post.topic && <span className="chip chip-muted">{post.topic}</span>}
        </div>
      </div>

      <p className="post-content">{post.content}</p>

      <div className="post-actions">
        <button onClick={handleLike} className={`action-btn ${liked ? 'liked' : ''}`} type="button">
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>

        <button onClick={toggleComments} className="action-btn" type="button">
          💬 {comments.length > 0 ? comments.length : 'Comment'}
        </button>
      </div>

      {showComments && (
        <div className="comments-wrap">
          {loadingComments ? (
            <div className="post-time">Loading comments...</div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="comment-row">
                <div className="comment-avatar">
                  {c.is_anonymous ? '👻' : (c.username?.[0] || '?').toUpperCase()}
                </div>

                <div className="comment-bubble">
                  <span className="comment-name">
                    {c.is_anonymous ? 'Anonymous' : c.username}
                  </span>

                  <span>{c.content}</span>

                  {/* 🔥 DELETE BUTTON */}
                  {user?.id === c.author_id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      style={{
                        marginLeft: 10,
                        color: '#f87171',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="post-time">No comments yet.</div>
          )}

          <form onSubmit={handleComment} className="comment-form">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? 'Add a comment...' : 'Login to comment'}
              className="app-input small"
              disabled={!user}
            />

            <button
              type="button"
              onClick={() => setAnonComment((v) => !v)}
              className={`icon-toggle ${anonComment ? 'active' : ''}`}
              disabled={!user}
            >
              👻
            </button>

            <button
              type="submit"
              className="btn-primary compact"
              disabled={loadingCommentSubmit || !user}
            >
              {loadingCommentSubmit ? '...' : 'Send'}
            </button>
          </form>

          {commentError && <div className="form-error">{commentError}</div>}
        </div>
      )}
    </article>
  );
}