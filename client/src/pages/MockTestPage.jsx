import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBookmarks, toggleBookmark } from '../features/bookmarks/bookmarkStore.js';
import {
  cancelMockTestRequest,
  getMockTestRequest,
  saveAnswerRequest,
  saveReviewRequest,
  submitMockTestRequest,
} from '../features/mockTest/mockTestService.js';

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function MockTestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [reviewIds, setReviewIds] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarks().map((item) => item.questionId));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const [visitedIds, setVisitedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const autoSubmitStarted = useRef(false);
  const answerQueue = useRef(Promise.resolve());

  const finishTest = useCallback(async (automatic = false) => {
    if (autoSubmitStarted.current) return;
    autoSubmitStarted.current = true;
    setSubmitting(true);
    setError('');
    try {
      // Wait for any last answer selection to reach the backend before scoring.
      await answerQueue.current;
      const response = await submitMockTestRequest(testId);
      navigate(`/mock-test/${testId}/result`, { replace: true, state: { result: response.data } });
    } catch (submitError) {
      autoSubmitStarted.current = false;
      setError(automatic ? `The timer ended, but submission failed: ${submitError.message}` : submitError.message);
      setSubmitting(false);
    }
  }, [navigate, testId]);

  useEffect(() => {
    let mounted = true;
    const loadTest = async () => {
      try {
        const response = await getMockTestRequest(testId);
        if (!mounted) return;
        setTest(response.data);
        setAnswers(response.data.answers || {});
        setReviewIds(response.data.reviewQuestionIds || []);
        setRemainingSeconds(response.data.remainingSeconds);
        setDeadline(Date.now() + (response.data.remainingSeconds * 1000));
        if (response.data.questions[0]) setVisitedIds([response.data.questions[0].questionId]);
      } catch (loadError) {
        if (mounted) setError(loadError.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadTest();
    return () => { mounted = false; };
  }, [testId]);

  useEffect(() => {
    if (!deadline) return undefined;
    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
    };
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [deadline]);

  useEffect(() => {
    if (test && remainingSeconds === 0 && !loading && !autoSubmitStarted.current) {
      finishTest(true);
    }
  }, [finishTest, loading, remainingSeconds, test]);

  const currentQuestion = test?.questions?.[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const notAnsweredCount = (test?.totalQuestions || 0) - answeredCount;

  useEffect(() => {
    if (currentQuestion) setBookmarkIds(getBookmarks().map((item) => item.questionId));
  }, [currentQuestion]);

  const toggleCurrentBookmark = () => {
    if (!currentQuestion || !test) return;
    toggleBookmark(currentQuestion, { subject: test.subject, examType: test.examType });
    setBookmarkIds(getBookmarks().map((item) => item.questionId));
  };

  const chooseAnswer = (option) => {
    if (!currentQuestion || submitting || saving || remainingSeconds <= 0) return;
    const previous = answers[currentQuestion.questionId];
    const nextOption = previous === option ? null : option;
    setAnswers((current) => {
      const updated = { ...current };
      if (nextOption === null) delete updated[currentQuestion.questionId];
      else updated[currentQuestion.questionId] = nextOption;
      return updated;
    });
    setSaving(true);
    // Serialize writes so a rapid series of selections cannot arrive out of order.
    answerQueue.current = answerQueue.current
      .then(() => saveAnswerRequest(testId, currentQuestion.questionId, nextOption))
      .catch((saveError) => {
        setError(`Could not save your answer: ${saveError.message}`);
        setAnswers((current) => {
          const updated = { ...current };
          if (previous) updated[currentQuestion.questionId] = previous;
          else delete updated[currentQuestion.questionId];
          return updated;
        });
      })
      .finally(() => setSaving(false));
  };

  const toggleReview = async () => {
    if (!currentQuestion || submitting || saving) return;
    const marked = !reviewIds.includes(currentQuestion.questionId);
    setReviewIds((current) => marked ? [...current, currentQuestion.questionId] : current.filter((id) => id !== currentQuestion.questionId));
    try {
      await saveReviewRequest(testId, currentQuestion.questionId, marked);
    } catch (requestError) {
      setError(requestError.message);
      setReviewIds((current) => marked ? current.filter((id) => id !== currentQuestion.questionId) : [...current, currentQuestion.questionId]);
    }
  };

  const cancelTest = async () => {
    if (!window.confirm('Cancel this mock test? Your answers will be discarded and no history will be saved.')) return;
    try {
      await cancelMockTestRequest(testId);
      navigate('/dashboard', { replace: true });
    } catch (cancelError) {
      setError(cancelError.message);
    }
  };

  const submitManually = async () => {
    const unanswered = (test?.totalQuestions || 0) - answeredCount;
    if (!window.confirm(`Submit your test now? ${unanswered} question(s) are unanswered.`)) return;
    await finishTest(false);
  };

  if (loading) return <div className="mx-auto max-w-4xl py-24 text-center text-slate-300">Loading your mock test…</div>;
  if (!test) return <div className="mx-auto max-w-3xl py-20 text-center"><h1 className="text-2xl font-bold text-white">Test unavailable</h1><p className="mt-3 text-slate-400">{error || 'This test session cannot be found.'}</p><button onClick={() => navigate('/dashboard')} className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Back to dashboard</button></div>;

  return (
    <section className="mx-auto max-w-6xl py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div><p className="text-sm text-cyan-400">{test.examType} · {test.subject}</p><h1 className="mt-1 text-2xl font-bold text-white">Mock examination</h1><p className="mt-1 text-xs text-slate-500">Question {currentIndex + 1} of {test.totalQuestions}</p></div>
        <div className={`rounded-xl border px-4 py-2 text-center ${remainingSeconds <= 60 ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-slate-700 bg-slate-900 text-white'}`}><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Time remaining</p><p className="font-mono text-2xl font-bold" aria-live="off">{formatTime(remainingSeconds)}</p></div>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Question {currentIndex + 1}</span><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{currentQuestion.difficulty} · {currentQuestion.topic}</span></div>
          <h2 className="mt-5 whitespace-pre-wrap text-lg font-semibold leading-8 text-white">{currentQuestion.questionText}</h2>
          <div className="mt-6 grid gap-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const selected = answers[currentQuestion.questionId] === key;
              return <button key={key} disabled={submitting || saving || remainingSeconds <= 0} onClick={() => chooseAnswer(key)} aria-pressed={selected} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${selected ? 'border-cyan-400 bg-cyan-400/10 text-white' : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-500'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{key}</span><span className="pt-0.5 leading-6">{value}</span></button>;
            })}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <div className="flex flex-wrap gap-2"><button onClick={toggleCurrentBookmark} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${bookmarkIds.includes(currentQuestion.questionId) ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300' : 'border-slate-700 text-slate-300 hover:border-cyan-400/50'}`}>{bookmarkIds.includes(currentQuestion.questionId) ? '★ Bookmarked' : '☆ Bookmark question'}</button><button onClick={toggleReview} disabled={saving || submitting} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${reviewIds.includes(currentQuestion.questionId) ? 'border-amber-400/50 bg-amber-400/10 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-amber-400/50'}`}>{reviewIds.includes(currentQuestion.questionId) ? '★ Marked for review' : '☆ Mark for review'}</button></div>
            <div className="flex gap-2"><button disabled={currentIndex === 0} onClick={() => { const next = currentIndex - 1; setCurrentIndex(next); setVisitedIds((ids) => ids.includes(test.questions[next].questionId) ? ids : [...ids, test.questions[next].questionId]); }} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-30">Previous</button><button disabled={currentIndex === test.questions.length - 1} onClick={() => { const next = currentIndex + 1; setCurrentIndex(next); setVisitedIds((ids) => ids.includes(test.questions[next].questionId) ? ids : [...ids, test.questions[next].questionId]); }} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-30">Next</button></div>
          </div>
          {saving && <p className="mt-3 text-right text-xs text-slate-500">Saving answer…</p>}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-semibold text-white">Question palette</h2>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {test.questions.map((question, index) => {
              const answered = Boolean(answers[question.questionId]);
              const marked = reviewIds.includes(question.questionId);
              const visited = visitedIds.includes(question.questionId);
              return <button key={question.questionId} onClick={() => { setCurrentIndex(index); setVisitedIds((ids) => ids.includes(question.questionId) ? ids : [...ids, question.questionId]); }} aria-label={`Go to question ${index + 1}${answered ? ', answered' : ', unanswered'}${marked ? ', marked for review' : ''}`} className={`relative h-10 rounded-lg border text-sm font-semibold transition ${index === currentIndex ? 'border-cyan-300 ring-2 ring-cyan-400/30' : 'border-slate-700'} ${answered ? 'bg-emerald-500/20 text-emerald-300' : (visited ? 'bg-slate-800 text-slate-200' : 'bg-slate-950 text-slate-500')} ${marked ? 'outline outline-1 outline-amber-400' : ''}`}>{index + 1}{marked && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />}</button>;
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-400"><span>● Answered: {answeredCount}</span><span>● Not answered: {notAnsweredCount}</span><span><span className="text-amber-400">●</span> Review: {reviewIds.length}</span><span>● Not visited: {test.totalQuestions - visitedIds.length}</span></div>
          <div className="mt-6 rounded-xl bg-slate-950/70 p-3"><div className="flex justify-between text-xs text-slate-400"><span>Progress</span><span>{Math.round((answeredCount / test.totalQuestions) * 100)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(answeredCount / test.totalQuestions) * 100}%` }} /></div></div>
          <button disabled={submitting || saving} onClick={submitManually} className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit test'}</button>
          <button disabled={submitting} onClick={cancelTest} className="mt-2 w-full rounded-xl border border-rose-500/30 px-4 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">Cancel test</button>
        </aside>
      </div>
      <p className="mt-5 text-center text-xs text-slate-500">Correct: +3 marks · Incorrect: −1 mark · Unattempted: 0 marks. Your answers are saved temporarily during this session.</p>
    </section>
  );
}
