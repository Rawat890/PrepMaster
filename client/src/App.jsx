import { useEffect } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MockTestPage from './pages/MockTestPage.jsx';
import MockTestResultPage from './pages/MockTestResultPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import BookmarksPage from './pages/BookmarksPage.jsx';
import ExamUpdatesPage from './pages/ExamUpdatesPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { fetchCurrentUser, logoutUser } from './features/auth/authSlice.js';

function App() {
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">ExamPrep <span className="text-cyan-400">AI</span></Link>
          <div className="flex items-center gap-4 text-sm">
            {initialized && user ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white">Dashboard</Link>
                <Link to="/bookmarks" className="text-slate-300 hover:text-white">Bookmarks</Link>
                <Link to="/exam-updates" className="text-slate-300 hover:text-white">Exam updates</Link>
                <button onClick={() => dispatch(logoutUser())} className="text-slate-300 hover:text-white">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white">Log in</Link>
                <Link to="/register" className="rounded-lg bg-cyan-400 px-3 py-2 font-semibold text-slate-950 hover:bg-cyan-300">Get started</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/exam-updates" element={<ExamUpdatesPage />} />
            <Route path="/mock-test/:testId" element={<MockTestPage />} />
            <Route path="/mock-test/:testId/result" element={<MockTestResultPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
