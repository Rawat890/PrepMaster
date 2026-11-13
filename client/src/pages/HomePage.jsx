const subjects = [
  { name: 'Maths Aptitude', description: 'Quantitative aptitude and data interpretation' },
  { name: 'Reasoning', description: 'Verbal, analytical and logical reasoning' },
  { name: 'English', description: 'Grammar, vocabulary and comprehension' },
  { name: 'General Studies', description: 'General awareness, science, history and more' },
];

/** Initial landing page used to verify the React application and Tailwind styling. */
function HomePage() {
  return (
    <section>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
        Prepare smarter
      </p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        Your personal government exam preparation workspace.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
        Practice consistently, understand your performance and prepare for your next opportunity.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <article key={subject.name} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">{subject.name}</h2>
            <p className="mt-2 text-sm text-slate-400">{subject.description}</p>
            <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-500">
              Mock tests coming in the next phase
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
