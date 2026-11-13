import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createExamUpdateRequest, deleteExamUpdateRequest, editExamUpdateRequest, getExamUpdatesRequest } from '../features/mockTest/mockTestService.js';

const emptyForm = { examName: 'SSC CGL', title: '', category: 'Other', details: '', sourceUrl: '', importantDate: '', status: 'Upcoming' };
const EXAMS = ['SSC CGL', 'SBI PO', 'SBI SO', 'IBPS RRB PO', 'Railway', 'Other'];
const CATEGORIES = ['Notification', 'Application', 'Admit Card', 'Exam Date', 'Answer Key', 'Result', 'Other'];
const STATUSES = ['Upcoming', 'In Progress', 'Completed', 'Archived'];

export default function ExamUpdatesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const response = await getExamUpdatesRequest(); setItems(response.data); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => { setForm(emptyForm); setEditingId(''); };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, importantDate: form.importantDate || null };
    try {
      if (editingId) await editExamUpdateRequest(editingId, payload);
      else await createExamUpdateRequest(payload);
      reset(); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const edit = (item) => {
    setEditingId(item._id);
    setForm({ examName: item.examName, title: item.title, category: item.category, details: item.details || '', sourceUrl: item.sourceUrl || '', importantDate: item.importantDate ? new Date(item.importantDate).toISOString().slice(0, 10) : '', status: item.status });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this exam update?')) return;
    try { await deleteExamUpdateRequest(id); setItems((current) => current.filter((item) => item._id !== id)); }
    catch (requestError) { setError(requestError.message); }
  };

  return <section className="mx-auto max-w-5xl py-10 sm:py-14">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Personal tracker</p><h1 className="mt-2 text-3xl font-bold text-white">Exam updates & deadlines</h1><p className="mt-2 text-slate-400">Keep your own notification, application, admit-card and exam-date notes.</p></div><Link to="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">Dashboard</Link></div>
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-2">
      <h2 className="sm:col-span-2 text-lg font-semibold text-white">{editingId ? 'Edit update' : 'Add an exam update'}</h2>
      <label className="text-sm text-slate-300">Examination<select name="examName" value={form.examName} onChange={change} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3">{EXAMS.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm text-slate-300">Category<select name="category" value={form.category} onChange={change} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3">{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm text-slate-300 sm:col-span-2">Title<input required maxLength="160" name="title" value={form.title} onChange={change} placeholder="e.g. Application closes" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
      <label className="text-sm text-slate-300">Important date<input type="date" name="importantDate" value={form.importantDate} onChange={change} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
      <label className="text-sm text-slate-300">Status<select name="status" value={form.status} onChange={change} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3">{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm text-slate-300 sm:col-span-2">Details<textarea name="details" value={form.details} onChange={change} rows="3" maxLength="2000" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3" placeholder="Eligibility notes, documents, reminders…" /></label>
      <label className="text-sm text-slate-300 sm:col-span-2">Official source URL (optional)<input type="url" name="sourceUrl" value={form.sourceUrl} onChange={change} placeholder="https://…" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-rose-300">{error}</p>}
      <div className="sm:col-span-2 flex flex-wrap gap-2"><button disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add update'}</button>{editingId && <button type="button" onClick={reset} className="rounded-xl border border-slate-700 px-4 py-3 text-sm">Cancel</button>}</div>
    </form>
    <div className="mt-8"><h2 className="text-xl font-bold text-white">Your tracked updates</h2>{loading ? <p className="mt-4 text-slate-400">Loading…</p> : items.length === 0 ? <p className="mt-4 rounded-xl border border-slate-800 p-5 text-sm text-slate-400">No exam updates saved yet.</p> : <div className="mt-4 space-y-3">{items.map((item) => <article key={item._id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-cyan-300">{item.examName} · {item.category}</p><h3 className="mt-1 font-semibold text-white">{item.title}</h3>{item.details && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{item.details}</p>}<p className="mt-2 text-xs text-slate-500">{item.importantDate ? new Date(item.importantDate).toLocaleDateString() : 'No date set'} · {item.status}</p>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyan-300">Open source ↗</a>}</div><div className="flex h-fit gap-2"><button onClick={() => edit(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">Edit</button><button onClick={() => remove(item._id)} className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-300">Delete</button></div></div></article>)}</div>}</div>
  </section>;
}
