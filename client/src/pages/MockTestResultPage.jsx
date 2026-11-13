import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getMockHistoryItemRequest } from '../features/mockTest/mockTestService.js';

export default function MockTestResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { testId } = useParams();
  const [savedResult, setSavedResult] = useState(null);
  const [loadingSavedResult, setLoadingSavedResult] = useState(!state?.result);
  const result = state?.result || savedResult;

  useEffect(() => {
    if (state?.result || !testId) { setLoadingSavedResult(false); return undefined; }
    let active = true;
    getMockHistoryItemRequest(testId)
      .then((response) => { if (active) setSavedResult(response.data); })
      .catch(() => { if (active) setSavedResult(null); })
      .finally(() => { if (active) setLoadingSavedResult(false); });
    return () => { active = false; };
  }, [state, testId]);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all');

  const visibleQuestions = useMemo(() => {
    if (!result?.questions) return [];
    const filtered = filter === 'all' ? result.questions : result.questions.filter((question) => question.status === filter);
    return showAll ? filtered : filtered.slice(0, 5);
  }, [filter, result, showAll]);

  if (loadingSavedResult) return <div className="mx-auto max-w-3xl py-24 text-center text-slate-400">Loading saved result…</div>;
  if (!result) return <div className="mx-auto max-w-3xl py-24 text-center"><h1 className="text-2xl font-bold text-white">Result not available</h1><p className="mt-3 text-slate-400">This completed test could not be found in your history.</p><button onClick={() => navigate('/dashboard')} className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Back to dashboard</button></div>;

  const scorePercent = Math.max(0, Math.min(100, (result.score / result.maximumMarks) * 100));
  const timeLabel = `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`;

  return (
    <section className="mx-auto max-w-5xl py-10 sm:py-14">
      <div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Test completed</p><h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Your performance</h1><p className="mt-2 text-slate-400">{result.examType} · {result.subject}</p></div>
      <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-slate-800 bg-slate-900/70 p-7 text-center">
        <p className="text-sm text-slate-400">Your score</p><p className="mt-2 text-6xl font-black tracking-tight text-white">{result.score}<span className="text-2xl font-semibold text-slate-500"> / {result.maximumMarks}</span></p><div className="mx-auto mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${scorePercent}%` }} /></div><p className="mt-3 text-sm text-slate-400">{scorePercent.toFixed(1)}% of maximum marks · {result.autoSubmitted ? 'Automatically submitted' : 'Submitted manually'}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Correct', result.correct, 'text-emerald-300'], ['Incorrect', result.incorrect, 'text-rose-300'], ['Unattempted', result.unattempted, 'text-slate-300'], ['Accuracy', `${result.accuracy}%`, 'text-cyan-300']].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p></div>)}
      </div>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-slate-400">Attempted: <strong className="text-white">{result.attempted}/30</strong></span><span className="text-slate-400">Time taken: <strong className="text-white">{timeLabel}</strong></span><span className="text-slate-400">Marking: <strong className="text-white">+3 / −1</strong></span></div></div>

      {result.questions?.length > 0 && <div className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold text-white">Answer review</h2><p className="mt-1 text-sm text-slate-400">Review correct answers, your selections and explanations.</p></div><label className="text-sm text-slate-300">Show
        <select value={filter} onChange={(event) => { setFilter(event.target.value); setShowAll(false); }} className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"><option value="all">All questions</option><option value="correct">Correct</option><option value="incorrect">Incorrect</option><option value="unattempted">Unattempted</option></select>
      </label></div>
      <div className="mt-5 space-y-4">{visibleQuestions.map((question) => <article key={question.questionId} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question {question.questionNumber} · {question.topic}</p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${question.status === 'correct' ? 'bg-emerald-500/10 text-emerald-300' : question.status === 'incorrect' ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>{question.status} · {question.marksAwarded > 0 ? '+' : ''}{question.marksAwarded}</span></div><h3 className="mt-3 font-semibold leading-7 text-white">{question.questionText}</h3><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(question.options).map(([key, value]) => <div key={key} className={`rounded-lg border p-3 text-sm ${key === question.correctOption ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : key === question.selectedOption ? 'border-rose-500/50 bg-rose-500/10 text-rose-200' : 'border-slate-800 text-slate-400'}`}><strong className="mr-2">{key}.</strong>{value}{key === question.correctOption ? ' · Correct answer' : key === question.selectedOption ? ' · Your answer' : ''}</div>)}</div><div className="mt-4 rounded-xl bg-slate-950/70 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Explanation</p><p className="mt-2 text-sm leading-6 text-slate-300">{question.explanation}</p></div></article>)}</div>
      {visibleQuestions.length < (filter === 'all' ? result.questions.length : result.questions.filter((question) => question.status === filter).length) && <button onClick={() => setShowAll(true)} className="mt-5 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400">Show remaining questions</button>}
      </div>}
      {result.topicPerformance?.length > 0 && <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="text-xl font-bold text-white">Topic performance</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{result.topicPerformance.map((topic) => <div key={topic.topic} className="rounded-xl bg-slate-950/60 p-4"><div className="flex justify-between gap-2"><strong className="text-sm text-white">{topic.topic}</strong><span className="text-sm text-cyan-300">{topic.accuracy}%</span></div><p className="mt-2 text-xs text-slate-400">{topic.correct} correct · {topic.incorrect} incorrect · {topic.unattempted} skipped · Score {topic.score}</p></div>)}</div></section>}
      <div className="mt-10 flex flex-wrap justify-center gap-3"><Link to="/history" className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400">View history</Link><Link to="/dashboard" className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300">Generate another mock test</Link></div>
    </section>
  );
}
