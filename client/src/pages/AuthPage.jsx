import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, loginUser, registerUser } from '../features/auth/authSlice.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: '' }));
    if (error) dispatch(clearAuthError());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    const action = isRegister ? registerUser(form) : loginUser({ email: form.email, password: form.password });
    const result = await dispatch(action);
    setSubmitting(false);
    if (isRegister ? registerUser.fulfilled.match(result) : loginUser.fulfilled.match(result)) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } else if (result.payload?.errors) {
      setFieldErrors(result.payload.errors);
    }
  };

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15';

  return (
    <div className="mx-auto grid min-h-[75vh] max-w-5xl items-center gap-12 py-10 md:grid-cols-2">
      <section>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">Your preparation workspace</p>
        <h1 className="max-w-lg text-4xl font-bold leading-tight text-white md:text-5xl">
          Prepare smarter. <span className="text-cyan-400">Perform better.</span>
        </h1>
        <p className="mt-5 max-w-md leading-7 text-slate-400">
          Practice for SSC, banking and railway examinations with fresh AI-generated mock tests and meaningful progress tracking.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">AI-generated questions</div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">Timed mock tests</div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">Subject-wise analytics</div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">Exam notifications</div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <h2 className="text-2xl font-bold text-white">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mt-2 text-sm text-slate-400">{isRegister ? 'Start building a consistent preparation routine.' : 'Log in to continue your preparation.'}</p>

        {error && <div role="alert" className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {isRegister && (
            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-300">Full name</label>
              <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={60} value={form.name} onChange={updateField} className={inputClass} placeholder="Your name" />
              {fieldErrors.name && <p className="mt-1 text-xs text-rose-400">{fieldErrors.name}</p>}
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-300">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={updateField} className={inputClass} placeholder="you@example.com" />
            {fieldErrors.email && <p className="mt-1 text-xs text-rose-400">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
            <input id="password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} maxLength={72} value={form.password} onChange={updateField} className={inputClass} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} />
            {fieldErrors.password && <p className="mt-1 text-xs text-rose-400">{fieldErrors.password}</p>}
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-cyan-400 hover:text-cyan-300">{isRegister ? 'Log in' : 'Create one'}</Link>
        </p>
      </section>
    </div>
  );
}
