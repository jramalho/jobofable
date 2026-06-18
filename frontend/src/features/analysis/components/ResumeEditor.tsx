import { Card } from '../../../components/Card';
import { Textarea } from '../../../components/Textarea';
import type {
  EducationEntry,
  LanguageEntry,
  OptimizedResume,
  ResumeHeader,
  SkillGroup,
} from '../types/analysis.types';

interface ResumeEditorProps {
  resume: OptimizedResume;
  onHeaderChange: (patch: Partial<ResumeHeader>) => void;
  onSummaryChange: (value: string) => void;
  onExperienceBulletChange: (experienceIndex: number, bulletIndex: number, value: string) => void;
  onSkillsChange: (skills: SkillGroup[]) => void;
  onEducationChange: (education: EducationEntry[]) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
}

export function ResumeEditor({
  resume,
  onHeaderChange,
  onSummaryChange,
  onExperienceBulletChange,
  onSkillsChange,
  onEducationChange,
  onLanguagesChange,
}: ResumeEditorProps) {
  return (
    <Card
      title="Optimized resume"
      subtitle="Edit the generated content before exporting. Companies, titles and dates come straight from your real resume."
    >
      <div className="space-y-6">
        <HeaderSection header={resume.header} onChange={onHeaderChange} />

        <Textarea
          id="resume-summary"
          label="Summary"
          rows={4}
          value={resume.summary}
          onChange={(event) => onSummaryChange(event.target.value)}
        />

        <SkillsSection skills={resume.skills} onChange={onSkillsChange} />
        <ExperienceSection resume={resume} onBulletChange={onExperienceBulletChange} />
        <ProjectsSection resume={resume} />
        <EducationSection education={resume.education} onChange={onEducationChange} />
        <CertificationsSection resume={resume} />
        <LanguagesSection languages={resume.languages} onChange={onLanguagesChange} />
      </div>
    </Card>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h3>;
}

const HEADER_FIELDS: { key: keyof ResumeHeader; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Professional title' },
  { key: 'location', label: 'Location' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'linkedin', label: 'LinkedIn' },
];

function HeaderSection({
  header,
  onChange,
}: {
  header: ResumeHeader;
  onChange: (patch: Partial<ResumeHeader>) => void;
}) {
  return (
    <div className="space-y-3">
      <SectionTitle>Header</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {HEADER_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
            <input
              type="text"
              value={header[key] ?? ''}
              onChange={(event) => onChange({ [key]: event.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsSection({ skills, onChange }: { skills: SkillGroup[]; onChange: (skills: SkillGroup[]) => void }) {
  if (skills.length === 0) return null;

  function handleItemsChange(index: number, itemsText: string) {
    const next = skills.map((group, groupIndex) =>
      groupIndex === index
        ? { ...group, items: itemsText.split(',').map((item) => item.trim()).filter(Boolean) }
        : group,
    );
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <SectionTitle>Skills</SectionTitle>
      {skills.map((group, index) => (
        <div key={`${group.category}-${index}`}>
          <label className="mb-1 block text-sm font-medium text-slate-700">{group.category}</label>
          <input
            type="text"
            value={group.items.join(', ')}
            onChange={(event) => handleItemsChange(index, event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ))}
    </div>
  );
}

function ExperienceSection({
  resume,
  onBulletChange,
}: {
  resume: OptimizedResume;
  onBulletChange: (experienceIndex: number, bulletIndex: number, value: string) => void;
}) {
  if (resume.experience.length === 0) return null;
  return (
    <div className="space-y-4">
      <SectionTitle>Experience</SectionTitle>
      {resume.experience.map((role, experienceIndex) => (
        <div key={`${role.company}-${experienceIndex}`} className="rounded-lg border border-slate-200 p-4">
          <p className="font-medium text-slate-900">
            {role.title} — {role.company}
          </p>
          <p className="text-xs text-slate-500">
            {[role.location, [role.startDate, role.endDate ?? 'Present'].filter(Boolean).join(' – ')]
              .filter(Boolean)
              .join(' | ')}
          </p>
          <div className="mt-3 space-y-2">
            {role.bullets.map((bullet, bulletIndex) => (
              <textarea
                key={bulletIndex}
                rows={2}
                value={bullet}
                onChange={(event) => onBulletChange(experienceIndex, bulletIndex, event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsSection({ resume }: { resume: OptimizedResume }) {
  if (resume.projects.length === 0) return null;
  return (
    <div className="space-y-3">
      <SectionTitle>Projects</SectionTitle>
      {resume.projects.map((project, index) => (
        <div key={`${project.name}-${index}`} className="rounded-lg border border-slate-200 p-4">
          <p className="font-medium text-slate-900">{project.name}</p>
          {project.description && <p className="mt-1 text-sm text-slate-600">{project.description}</p>}
          {project.technologies.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">Technologies: {project.technologies.join(', ')}</p>
          )}
          {project.bullets.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {project.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function EducationSection({
  education,
  onChange,
}: {
  education: EducationEntry[];
  onChange: (education: EducationEntry[]) => void;
}) {
  if (education.length === 0) return null;

  function handleChange(index: number, field: keyof EducationEntry, value: string) {
    const next = education.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry,
    );
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <SectionTitle>Education</SectionTitle>
      {education.map((entry, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={entry.institution}
            onChange={(event) => handleChange(index, 'institution', event.target.value)}
            placeholder="Institution"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={[entry.degree, entry.field].filter(Boolean).join(' in ')}
            onChange={(event) => handleChange(index, 'degree', event.target.value)}
            placeholder="Degree"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ))}
    </div>
  );
}

function CertificationsSection({ resume }: { resume: OptimizedResume }) {
  if (resume.certifications.length === 0) return null;
  return (
    <div className="space-y-2">
      <SectionTitle>Certifications</SectionTitle>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        {resume.certifications.map((cert, index) => (
          <li key={index}>{[cert.name, cert.issuer, cert.date].filter(Boolean).join(' — ')}</li>
        ))}
      </ul>
    </div>
  );
}

function LanguagesSection({
  languages,
  onChange,
}: {
  languages: LanguageEntry[];
  onChange: (languages: LanguageEntry[]) => void;
}) {
  if (languages.length === 0) return null;

  function handleChange(index: number, field: keyof LanguageEntry, value: string) {
    const next = languages.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry,
    );
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <SectionTitle>Languages</SectionTitle>
      {languages.map((entry, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={entry.language}
            onChange={(event) => handleChange(index, 'language', event.target.value)}
            placeholder="Language"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={entry.level ?? ''}
            onChange={(event) => handleChange(index, 'level', event.target.value)}
            placeholder="Level (e.g. fluent)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ))}
    </div>
  );
}
