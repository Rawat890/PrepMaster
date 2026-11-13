import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice.js';
import {
  generateMockTestRequest,
  getDashboardStatsRequest,
} from '../features/mockTest/mockTestService.js';

const SUBJECTS = ['Maths Aptitude', 'Reasoning', 'English', 'General Awareness'];
const EXAMS = ['SSC CGL', 'SBI PO', 'SBI SO', 'IBPS RRB PO', 'Railway'];
const SUBJECT_DETAILS = [
  { name: 'Maths Aptitude', description: 'Arithmetic, algebra, geometry and data interpretation', icon: '∑' },
  { name: 'Reasoning', description: 'Verbal, non-verbal and analytical reasoning', icon: '◇' },
  { name: 'English', description: 'Grammar, vocabulary and comprehension', icon: 'Aa' },
  { name: 'General Awareness', description: 'Static GK, history, geography, polity and science', icon: '◎' },
];
const formatDuration = (seconds = 0) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [examType, setExamType] = useState(EXAMS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    let active = true;
    getDashboardStatsRequest()
      .then((response) => { if (active) setStats(response.data); })
      .catch((requestError) => { if (active) setStatsError(requestError.message); });
    return () => { active = false; };
  }, []);

  const generateTest = async (chosenSubject = subject) => {
    setSubject(chosenSubject);
    setError('');
    setLoading(true);
    try {
      const response = await generateMockTestRequest({ subject: chosenSubject, examType });
      navigate(`/mock-test/${response.data.testId}`, { state: { initialTest: response.data } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const overview = stats?.overview;

  return (
    <section className="mx-auto max-w-6xl py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Your workspace</p><h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Welcome back, {user?.name?.split(' ')[0] || 'Learner'}.</h1><p className="mt-2 text-slate-400">Build consistency, one practice session at a time.</p></div>
        <div className="flex flex-wrap gap-2"><Link to="/bookmarks" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400">Bookmarks</Link><Link to="/exam-updates" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400">Exam updates</Link><Link to="/history" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400">Test history</Link><button onClick={() => dispatch(logoutUser())} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-400 hover:text-rose-300">Log out</button></div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Tests completed', overview?.totalTests ?? '—', 'Your submitted attempts'],
          ['Questions answered', overview?.totalAttempted ?? '—', `${overview?.totalCorrect ?? 0} correct overall`],
          ['Overall accuracy', overview ? `${overview.overallAccuracy}%` : '—', 'Correct / attempted'],
          ['Study time', overview ? formatDuration(overview.totalTimeTaken) : '—', 'Time spent in mock tests'],
        ].map(([label, value, detail]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}
      </div>
      {statsError && <p className="mt-3 text-xs text-amber-300">Progress statistics could not be loaded: {statsError}</p>}

      {stats?.studyInsights && <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]"><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-slate-400">Daily practice goal</p><h2 className="mt-1 text-2xl font-bold text-white">{stats.studyInsights.todayQuestions} / {stats.studyInsights.dailyGoal} questions</h2></div><div className="text-right"><p className="text-2xl font-bold text-amber-300">{stats.studyInsights.streakDays} 🔥</p><p className="text-xs text-slate-500">day streak</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${stats.studyInsights.goalProgress}%` }} /></div><p className="mt-2 text-xs text-slate-500">Goal progress is based on answered questions in completed tests. Keep your streak going.</p><div className="mt-4 grid grid-cols-7 gap-2">{stats.studyInsights.last7Days.map((day) => <div key={day.date} className="text-center"><div title={`${day.date}: ${day.questions} answered`} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${day.goalMet ? 'bg-emerald-400/20 text-emerald-300' : day.questions ? 'bg-cyan-400/15 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>{day.questions}</div><p className="mt-1 text-[10px] text-slate-500">{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</p></div>)}</div></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="text-lg font-bold text-white">Topics to improve</h2><p className="mt-1 text-xs text-slate-500">Based on at least five attempted questions per topic.</p>{stats.studyInsights.weakTopics.length ? <div className="mt-4 space-y-3">{stats.studyInsights.weakTopics.map((topic) => <div key={topic.topic}><div className="flex justify-between gap-2 text-sm"><span className="text-slate-200">{topic.topic}</span><span className="text-rose-300">{topic.accuracy}%</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-800"><div className="h-full rounded-full bg-rose-400" style={{ width: `${topic.accuracy}%` }} /></div><p className="mt-1 text-[10px] text-slate-500">{topic.questions} questions attempted in this topic</p></div>)}</div> : <p className="mt-4 text-sm text-slate-400">Complete more mock tests to identify topics that need attention.</p>}</article></section>}

      {stats?.subjects?.length > 0 && <section className="mt-9"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-white">Subject-wise performance</h2><p className="mt-1 text-sm text-slate-400">Accuracy across your completed attempts.</p></div><Link to="/history" className="text-sm font-semibold text-cyan-300">Full history →</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{stats.subjects.map((item) => <article key={item.subject} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-white">{item.subject}</h3><span className="text-sm font-semibold text-cyan-300">{item.averageAccuracy}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(0, Math.min(100, item.averageAccuracy))}%` }} /></div><p className="mt-2 text-xs text-slate-500">{item.tests} tests · {item.questions} questions · {item.correct} correct</p></article>)}</div></section>}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Test format</p><p className="mt-2 text-2xl font-bold text-white">30 questions</p><p className="mt-1 text-xs text-slate-500">Freshly generated by Groq AI</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Time limit</p><p className="mt-2 text-2xl font-bold text-white">25 minutes</p><p className="mt-1 text-xs text-slate-500">Automatic submission at zero</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Marking scheme</p><p className="mt-2 text-2xl font-bold text-white">+3 / −1</p><p className="mt-1 text-xs text-slate-500">Correct / incorrect response</p></div>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-white">Choose a subject</h2><p className="mt-1 text-sm text-slate-400">Each attempt contains a new set of 30 mixed-difficulty questions.</p></div><label className="text-sm text-slate-300">Target examination<select value={examType} onChange={(event) => setExamType(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400">{EXAMS.map((exam) => <option key={exam} value={exam}>{exam}</option>)}</select></label></div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{SUBJECT_DETAILS.map((item) => <article key={item.name} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-xl font-bold text-cyan-300">{item.icon}</div><div className="min-w-0 flex-1"><h3 className="font-semibold text-white">{item.name}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p></div></div><button disabled={loading} onClick={() => generateTest(item.name)} className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">{loading && subject === item.name ? 'Generating questions…' : `Generate ${item.name} test`}</button></article>)}</div>
      <p className="mt-5 text-xs leading-5 text-slate-500">Generated questions and in-progress answers stay temporarily in server memory. Completed history stores scores and topic aggregates only—not question text, options or answer keys.</p>
    </section>
  );
}
