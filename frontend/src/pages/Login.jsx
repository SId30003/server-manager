import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sm-login">
      <div className="sm-login__card">
        <div className="sm-login__brand">
          <span className="sm-login__brand-mark" />
          <span>Server Manager</span>
        </div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="sm-login__sub">
          {mode === 'login'
            ? 'Log in to manage your connected servers.'
            : 'Set up an account to start connecting servers.'}
        </p>

        <form className="sm-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="sm-field">
              <span>Name</span>
              <input value={form.name} onChange={update('name')} placeholder="Ada Lovelace" required />
            </label>
          )}
          <label className="sm-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="sm-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <p className="sm-form__error">{error}</p>}

          <Button type="submit" size="lg" loading={submitting} style={{ marginTop: 4 }}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>

        <button
          className="sm-login__switch"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
