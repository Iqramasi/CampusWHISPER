

import axios from 'axios';
import { useAuthStore } from '../store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('❌ API ERROR:', err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

// AUTH
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);

// POSTS
export const getPosts = () => api.get('/api/posts');
export const createPost = (data) => api.post('/api/posts', data);
export const deletePost = (id) => api.delete(`/api/posts/${id}`);

// LIKE
export const likePost = (id) => api.post(`/api/posts/${id}/like`);
export const unlikePost = (id) => api.delete(`/api/posts/${id}/like`);

// TRENDING (FIXED)
export const getTrending = () => api.get('/api/posts/trending');

// COMMENTS
export const getComments = (id) => api.get(`/api/posts/${id}/comments`);
export const addComment = (id, data) =>
  api.post(`/api/posts/${id}/comments`, data);
export const deleteComment = (id) =>
  api.delete(`/api/posts/comments/${id}`);

export default api;