

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/auth';
import { getPosts, likePost, unlikePost, getTrending } from '../lib/api';

import AuthModal from '../components/AuthModal';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import GlobeView from '../components/GlobeView';
import ThemedSelect from '../components/ThemedSelect';
import MyActivity from '../components/MyActivity';

const POST_TOPICS = [
  'General','Confession','Crush','Question','Rant',
  'Advice','Review','Recommendation','Campus Tea','Funny','Serious'
];

export default function Home() {
  const { user, token, init, logout } = useAuthStore();

  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [feedType, setFeedType] = useState('college');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [view, setView] = useState('feed');

  useEffect(() => {
    init();
  }, [init]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (feedType === 'college' && user?.college) {
        params.college = user.college;
      }

      const { data } = await getPosts(params);
      setPosts(data?.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [feedType, user, refreshKey]);

  const fetchTrending = useCallback(async () => {
    try {
      const { data } = await getTrending();
      const list = data?.posts || [];

      const top = list
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5);

      setTrending(top);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchTrending();
  }, [fetchPosts, fetchTrending]);

  const handleLike = async (postId, liked) => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      if (liked) await unlikePost(postId);
      else await likePost(postId);

      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error('LIKE ERROR:', e);
    }
  };

  const handleLogout = () => {
    logout();
    setFeedType('college');
    setSelectedTopic('');
    setView('feed');
  };

  const normalizeTopic = (value) =>
    (value || 'General').toLowerCase();

  const displayPosts = feedType === 'trending' ? trending : posts;

  const filteredPosts = useMemo(() => {
    return displayPosts.filter((post) => {
      if (!selectedTopic) return true;
      return normalizeTopic(post.topic) === normalizeTopic(selectedTopic);
    });
  }, [displayPosts, selectedTopic]);

  if (feedType === 'global') {
    return (
      <GlobeView
        posts={posts}
        onBack={() => {
          setFeedType('college');
          setView('feed');
        }}
      />
    );
  }

  const topicOptions = [
    { value: '', label: 'All' },
    ...POST_TOPICS.map((t) => ({ value: t, label: t }))
  ];

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-top">

          <div className="brand-block">
            <h2>CampusWhisper</h2>
          </div>

          <div className="sidebar-nav">
            <button onClick={() => { setFeedType('college'); setView('feed'); }}
              className={`sidebar-btn ${feedType==='college' && view==='feed' ? 'active' : ''}`}>
              Campus
            </button>

            <button onClick={() => { setFeedType('global'); setView('feed'); }}
              className={`sidebar-btn ${feedType==='global' ? 'active' : ''}`}>
              Globe
            </button>

            <button onClick={() => { setFeedType('trending'); setView('feed'); }}
              className={`sidebar-btn ${feedType==='trending' ? 'active' : ''}`}>
              Trending
            </button>

            <button onClick={() => setView('activity')}
              className={`sidebar-btn ${view==='activity' ? 'active' : ''}`}>
              My Activity
            </button>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Genre</p>
            <ThemedSelect
              value={selectedTopic}
              onChange={setSelectedTopic}
              options={topicOptions}
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="sidebar-footer">
          {user ? (
            <div className="user-box">
              <div>
                <div className="user-name">{user.username}</div>
                <div className="user-college">{user.college}</div>
              </div>

              <button onClick={handleLogout} className="sidebar-btn danger">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="sidebar-btn">
              Login / Register
            </button>
          )}
        </div>

      </aside>

      {/* MAIN */}
      <main className="main-content">
        <div className="content-wrap">

          {view === 'activity' ? (
            <MyActivity />
          ) : (
            <>
              {user && feedType !== 'trending' && (
                <CreatePost onPost={fetchPosts} />
              )}

              {loading ? (
                <p className="status-text">Loading...</p>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    onLike={handleLike}
                  />
                ))
              ) : (
                <p className="status-text">No posts found.</p>
              )}
            </>
          )}

        </div>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}