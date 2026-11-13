import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookmarks, removeBookmark } from '../features/bookmarks/bookmarkStore.js';

export default function BookmarksPage() {
  const [items, setItems] = useState(() => getBookmarks());
  const [filter, setFilter] = useState('All');
  const subjects = ['All', ...new Set(items.map((item) => item.subject))];
  const visible = items.filter((item) => filter === 'All' || item.subject === filter);

  const remove = (id) => setItems(removeBookmark(id));
  return <section className="mx-auto max-w-5xl py-10 sm:py-14">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Saved for revision</p><h1 className="mt-2 text-3xl font-bold text-white">Bookmarked questions</h1><p className="mt-2 text-slate-400">Saved only in this browser. These are not uploaded to the server.</p></div><Link to="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">Dashboard</Link></div>
    <div className="mt-6 flex flex-wrap gap-2">{subjects.map((subject) => <button key={subject} onClick={() => setFilter(subject)} className={`rounded-full px-4 py-2 text-sm ${filter === subject ? 'bg-cyan-400 font-bold text-slate-950' : 'border border-slate-700 text-slate-300'}`}>{subject}</button>)}</div>
    {visible.length === 0 ? <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center"><h2 className="text-lg font-semibold text-white">No bookmarked questions</h2><p className="mt-2 text-sm text-slate-400">During a mock test, save questions you want to revisit.</p><Link to="/dashboard" className="mt-4 inline-flex rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Start practising</Link></div> : <div className="mt-6 space-y-4">{visible.map((item) => <article key={item.questionId} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex flex-wrap justify-between gap-2"><span className="text-xs text-cyan-300">{item.subject} · {item.examType} · {item.topic}</span><span className="text-xs text-slate-500">{item.difficulty}</span></div><h2 className="mt-3 whitespace-pre-wrap font-semibold leading-7 text-white">{item.questionText}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(item.options || {}).map(([key, value]) => <div key={key} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300"><b className="mr-2 text-cyan-300">{key}.</b>{value}</div>)}</div><div className="mt-4 flex justify-end"><button onClick={() => remove(item.questionId)} className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-300">Remove bookmark</button></div></article>)}</div>}
  </section>;
}
