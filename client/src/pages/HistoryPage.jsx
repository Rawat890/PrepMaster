import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMockHistoryRequest } from '../features/mockTest/mockTestService.js';

const formatDate = (value) => new Date(value).toLocaleString(undefined, {
  dateStyle: 'medium', timeStyle: 'short',
});

export default function HistoryPage() {
  const [history, setHistory] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPage = async (page) => {
    setLoading(true);
    setError('');
    try {
      const response = await getMockHistoryRequest(page, 10);
      setHistory(response.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPage(1); }, []);

  return (
    <section className="mx-auto max-w-5xl py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Your progress</p><h1 className="mt-2 text-3xl font-bold text-white">Mock test history</h1><p className="mt-2 text-slate-400">Completed attempts and topic-level performance.</p></div>
        <Link to="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400">Dashboard</Link>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}
      {loading ? <p className="mt-8 text-slate-400">Loading your history…</p> : history.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center"><h2 className="text-xl font-semibold text-white">No completed tests yet</h2><p className="mt-2 text-sm text-slate-400">Your submitted mock tests will appear here.</p><Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950">Generate your first test</Link></div>
      ) : (
        <>
          <p className="mt-6 text-sm text-slate-400">{history.total} completed {history.total === 1 ? 'attempt' : 'attempts'}</p>
          <div className="mt-4 space-y-3">{history.items.map((item) => (
            <article key={item.testId} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs text-slate-500">{formatDate(item.completedAt)}</p><h2 className="mt-1 text-lg font-semibold text-white">{item.subject}</h2><p className="mt-1 text-sm text-slate-400">{item.examType} · {item.totalQuestions} questions · {Math.floor(item.timeTaken / 60)}m {item.timeTaken % 60}s</p></div>
                <div className="text-right"><p className="text-2xl font-bold text-white">{item.score}<span className="text-sm font-medium text-slate-500"> / {item.maximumMarks}</span></p><p className="text-sm text-cyan-300">{item.accuracy}% accuracy</p></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-400"><span>Correct {item.correct} · Incorrect {item.incorrect} · Skipped {item.unattempted}</span><Link to={`/mock-test/${encodeURIComponent(item.testId)}/result`} className="font-semibold text-cyan-300 hover:text-cyan-200">View summary →</Link></div>
              {item.topicPerformance?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.topicPerformance.slice(0, 4).map((topic) => <span key={topic.topic} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{topic.topic}: {topic.accuracy}%</span>)}</div>}
            </article>
          ))}</div>
          <div className="mt-6 flex items-center justify-between"><button disabled={history.page <= 1} onClick={() => loadPage(history.page - 1)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-slate-400">Page {history.page} of {Math.max(1, history.totalPages)}</span><button disabled={history.page >= history.totalPages} onClick={() => loadPage(history.page + 1)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40">Next</button></div>
        </>
      )}
    </section>
  );
}
