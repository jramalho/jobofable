import { Link } from 'react-router-dom';

const BENEFITS = [
  {
    title: 'ATS-optimized resume',
    description:
      'A clean, single-column resume tailored to the job description — built to pass applicant tracking systems.',
  },
  {
    title: 'Personalized cover letter',
    description:
      'A short, specific letter that connects your real experience to the role. No clichés, no AI fluff.',
  },
  {
    title: 'Job-fit analysis',
    description:
      'A 0-100 match score with per-category breakdowns, missing keywords, gaps and practical recommendations.',
  },
  {
    title: 'PDF & DOCX export',
    description: 'Edit the generated documents and download them ready to send.',
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </span>
          <div className="flex items-center gap-4">
            <Link to="/analyses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Saved analyses
            </Link>
            <Link
              to="/new-analysis"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start analysis
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Tailor your resume to any job — without faking a single line.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Paste a job description, upload your resume (and optionally your LinkedIn export), and get an
            ATS-optimized resume, a personalized cover letter and an honest fit analysis in one shot.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/new-analysis"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Generate optimized application
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Honest by design: the AI improves positioning and wording — it never invents experience, metrics or
            skills.
          </p>
        </section>

        <section className="grid gap-6 pb-20 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">{benefit.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{benefit.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
