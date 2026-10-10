import { normalizeArabic, questionIdea } from './questionIdeas';

export interface CourseLessonUnit {
  contentId: string;
  category: string;
  title: string;
  sectionIds: string[];
  minutes: number;
}
const canonical = (s: string) => normalizeArabic(s).split(/[^\p{L}\p{N}]+/u)
  .map(t => t.replace(/^ال/, '')).filter(Boolean).join(' ');

// These are published teaching units, not new approved taxonomy/mastery nodes.
export function courseLessonUnits(contents: any[]): CourseLessonUnit[] {
  return contents.flatMap(content => {
    const category = String(content.subjectId || '').endsWith('verbal') ? 'verbal' :
      String(content.subjectId || '').endsWith('quantitative') ? 'quantitative' : '';
    if (!category) return [];
    const sections: any[] = content.sections || [];
    const units: CourseLessonUnit[] = [];
    for (let i = 0; i < sections.length; i++) {
      if (String(sections[i].type).toUpperCase() !== 'CONCEPT' || !sections[i].id) continue;
      const group = [sections[i]];
      for (let j = i + 1; j < sections.length &&
        ['EXAMPLE', 'WARNING', 'PRACTICE', 'PROBLEM'].includes(String(sections[j].type).toUpperCase()); j++) {
        if (sections[j].id) group.push(sections[j]);
      }
      const words = group.map(s => [s.body, s.problem, s.thinking, s.solution, s.why].filter(Boolean).join(' '))
        .join(' ').split(/\s+/).length;
      const examples = group.filter(s => String(s.type).toUpperCase() === 'EXAMPLE').length;
      units.push({ contentId: String(content._id), category,
        title: String(sections[i].title || content.title).replace(/\s*[—–].*$/, ''),
        sectionIds: group.map(s => String(s.id)), minutes: Math.max(5, Math.ceil(words / 120) + examples * 4 + 2) });
    }
    // Never label an entire long/unknown-duration video as a short reading task.
    if (!units.length && !sections.length && content.videoUrl && content.durationMinutes > 0) {
      units.push({ contentId: String(content._id), category, title: content.title,
        sectionIds: [], minutes: Math.ceil(content.durationMinutes) });
    }
    return units;
  });
}

export function questionMatchesLesson(q: any, unit: CourseLessonUnit) {
  if (q.category !== unit.category) return false;
  const title = canonical(unit.title);
  const label = canonical(q.subcategory || q.source?.subcategory || '');
  if (/استيعاب|مقرو|قراء/.test(title) && questionIdea(q).key.startsWith('reading-')) return true;
  if (!label) return false;
  if (title.includes(label) || label.includes(title)) return true;
  const significant = title.split(' ').filter(t => t.length > 2 && !['فكرة', 'اساسيات', 'مهارات'].includes(t));
  return significant.length > 0 && significant.every(t => label.split(' ').includes(t));
}
