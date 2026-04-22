'use client';

import { useState } from 'react';
import { createPost } from '../lib/api';
import { useAuthStore } from '../store/auth';
import ThemedSelect from './ThemedSelect';

const POST_TOPICS = [
  'General', 'Confession', 'Crush', 'Question', 'Rant',
  'Advice', 'Review', 'Recommendation', 'Campus Tea', 'Funny', 'Serious'
];

export default function CreatePost({ onPost }) {
  const { token, user } = useAuthStore(); // 🔥 include user
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    if (!token) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createPost({
        content: text,
        topic: topic || 'General',
        college: user?.college || 'global', // 🔥 FIX
      });

      setContent('');
      setTopic('');
      await onPost?.();
    } catch (err) {
      console.error('POST ERROR:', err?.response?.data || err);

      const status = err?.response?.status;
      const backendError =
        err?.response?.data?.error || err?.response?.data?.message;

      if (status === 401) setError('Session expired. Login again.');
      else if (backendError) setError(backendError);
      else setError('Failed to post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel create-post-panel">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What’s on your mind? Whisper it..."
        rows={4}
        maxLength={500}
        className="app-textarea"
      />

      <div className="create-post-toolbar">
        <div className="create-post-select">
          <ThemedSelect
            value={topic}
            onChange={setTopic}
            options={[
              { value: '', label: 'What’s this about?' },
              ...POST_TOPICS.map((item) => ({ value: item, label: item })),
            ]}
          />
        </div>

        <div className="create-post-actions">
          <span className={`char-count ${content.length > 450 ? 'danger' : ''}`}>
            {content.length}/500
          </span>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn-primary"
          >
            {loading ? 'Posting...' : 'Whisper'}
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </form>
  );
}