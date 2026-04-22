// 'use client';

// import { useState } from 'react';
// import { login, register } from '../lib/api';
// import { useAuthStore } from '../store/auth';

// export default function AuthModal({ onClose }) {
//   const storeLogin = useAuthStore((state) => state.login);

//   const [mode, setMode] = useState('login');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const [form, setForm] = useState({
//     username: '',
//     email: '',
//     password: '',
//     college: '',
//   });

//   const handleChange = (e) => {
//     setForm((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setError('');
//     setLoading(true);

//     try {
//       // 🔥 VALIDATION
//       if (!form.email || !form.password) {
//         throw new Error('Email & password required');
//       }

//       if (mode === 'register' && !form.username) {
//         throw new Error('Username required');
//       }

//       const fn = mode === 'login' ? login : register;

//       const payload =
//         mode === 'login'
//           ? {
//               email: form.email.trim(),
//               password: form.password.trim(),
//             }
//           : {
//               username: form.username.trim(),
//               email: form.email.trim(),
//               password: form.password.trim(),
//               college: form.college?.trim() || 'global',
//             };

//       const res = await fn(payload);

//       if (!res?.data?.user || !res?.data?.token) {
//         throw new Error('Invalid server response');
//       }

//       storeLogin(res.data.user, res.data.token);

//       onClose?.();

//     } catch (err) {
//       console.error('❌ AUTH ERROR:', err);

//       if (err.response) {
//         setError(err.response.data?.error || 'Server error');
//       } else {
//         setError(err.message || 'Something went wrong');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="modal-backdrop">
//       <div className="modal">
//         <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>

//         <form onSubmit={handleSubmit}>
//           {mode === 'register' && (
//             <input
//               name="username"
//               placeholder="Username"
//               value={form.username}
//               onChange={handleChange}
//             />
//           )}

//           <input
//             name="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={handleChange}
//           />

//           <input
//             name="password"
//             type="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={handleChange}
//           />

//           {mode === 'register' && (
//             <input
//               name="college"
//               placeholder="College"
//               value={form.college}
//               onChange={handleChange}
//             />
//           )}

//           <button type="submit" disabled={loading}>
//             {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
//           </button>
//         </form>

//         {error && <p className="form-error">{error}</p>}

//         <p
//           onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
//           style={{ cursor: 'pointer', marginTop: 10 }}
//         >
//           {mode === 'login'
//             ? 'No account? Register'
//             : 'Already have an account? Login'}
//         </p>

//         <button onClick={onClose} style={{ marginTop: 10 }}>
//           Close
//         </button>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import { login, register } from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function AuthModal({ onClose }) {
  const storeLogin = useAuthStore((s) => s.login);

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    college: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fn = mode === 'login' ? login : register;

      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;

      const res = await fn(payload);

      storeLogin(res.data.user, res.data.token);
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2 className="modal-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {mode === 'register' && (
            <input
              placeholder="Username"
              className="modal-input"
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />
          )}

          <input
            placeholder="Email"
            className="modal-input"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="modal-input"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          {mode === 'register' && (
            <input
              placeholder="College"
              className="modal-input"
              onChange={(e) =>
                setForm({ ...form, college: e.target.value })
              }
            />
          )}

          <button className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        {error && <p className="modal-error">{error}</p>}

        <p
          className="modal-switch"
          onClick={() =>
            setMode(mode === 'login' ? 'register' : 'login')
          }
        >
          {mode === 'login'
            ? 'No account? Register'
            : 'Already have an account? Login'}
        </p>

        <button className="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}