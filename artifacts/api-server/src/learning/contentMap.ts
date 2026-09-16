export type LearningProgram = 'qudrat' | 'tahsili';
export type LearningSubject =
  | 'verbal'
  | 'quantitative'
  | 'رياضيات'
  | 'فيزياء'
  | 'كيمياء'
  | 'أحياء'
  | 'علم الأرض'
  | 'علم البيئة';

export type LearningMappingStatus = 'mapped' | 'needs_review' | 'unmapped';
export type LearningSourceType =
  | 'mongo_question'
  | 'mongo_tahsili_question'
  | 'postgres_question'
  | 'legacy_json';

export interface LearningTaxonomyPath {
  program?: LearningProgram;
  subject?: LearningSubject;
  topic?: string;
  skill?: string;
  subSkill?: string;
  concept?: string;
}

export interface LearningMappingEvidence {
  field: string;
  value: string;
  confidence: 'explicit' | 'controlled' | 'candidate';
}

export interface QuestionMappingCandidate {
  sourceType: LearningSourceType;
  sourceKey: string;
  taxonomy: LearningTaxonomyPath;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  status: LearningMappingStatus;
  reviewReasons: string[];
  evidence: LearningMappingEvidence[];
  mappingVersion: string;
}

const VERBAL_CATEGORIES = new Set([
  'استيعاب المقروء',
  'التناظر اللفظي',
  'إكمال الجمل',
  'الخطأ السياقي',
  'المفردة المختلفة',
  'المفردة الشاذة',
  'العلاقات اللفظية',
  'المفردات',
]);

const QUANTITATIVE_CATEGORIES = new Set([
  'المقارنات',
  'المعادلات',
  'الهندسة',
  'النسبة المئوية',
  'الحركة والأنماط',
  'الإحصاء',
  'عمليات حسابية',
  'العمليات الحسابية',
  'النسبة والتناسب',
  'الكسور',
]);

const TAHSILI_SUBJECTS = new Set<LearningSubject>([
  'رياضيات',
  'فيزياء',
  'كيمياء',
  'أحياء',
  'علم البيئة',
]);

const DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);

const TAHSILI_SUBJECT_ALIASES: Record<string, LearningSubject> = {
  'الرياضيات': 'رياضيات',
  'رياضيات': 'رياضيات',
  'الفيزياء': 'فيزياء',
  'فيزياء': 'فيزياء',
  'الكيمياء': 'كيمياء',
  'كيمياء': 'كيمياء',
  'الأحياء': 'أحياء',
  'أحياء': 'أحياء',
  'علم البيئة': 'علم البيئة',
  'البيئة': 'علم البيئة',
  'علم الأرض': 'علم الأرض',
};

type SourceQuestion = {
  id?: number | string;
  questionId?: number | string;
  sourceNamespace?: string;
  category?: string;
  subcategory?: string;
  topic?: string;
  difficulty?: string;
  systemCategory?: string;
  subject?: string;
  text?: string;
  question?: string;
};

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pushReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function classifyQudratCategory(category: string | undefined): {
  subject?: 'verbal' | 'quantitative';
  status: LearningMappingStatus;
  reason?: string;
} {
  const normalized = nonEmpty(category);
  if (!normalized) {
    return { status: 'unmapped', reason: 'missing_category' };
  }
  if (VERBAL_CATEGORIES.has(normalized)) {
    return { subject: 'verbal', status: 'needs_review' };
  }
  if (QUANTITATIVE_CATEGORIES.has(normalized)) {
    return { subject: 'quantitative', status: 'needs_review' };
  }
  return { status: 'unmapped', reason: 'unrecognized_qudrat_category' };
}

export function classifyQuestion(
  question: SourceQuestion,
  sourceType: LearningSourceType,
): QuestionMappingCandidate {
  const sourceId = nonEmpty(question.questionId ?? question.id);
  const sourceNamespace = nonEmpty(question.sourceNamespace);
  const sourceKey = sourceId
    ? `${sourceType}:${sourceNamespace ? `${sourceNamespace}:` : ''}${sourceId}`
    : `${sourceType}:text:${(question.text ?? question.question ?? '').slice(0, 80)}`;
  const reasons: string[] = [];
  const evidence: LearningMappingEvidence[] = [];
  const taxonomy: LearningTaxonomyPath = {};

  if (sourceType === 'mongo_tahsili_question' || question.systemCategory === 'tahsili') {
    const sourceSubject = nonEmpty(question.subject ?? question.subcategory ?? question.category);
    const subject = sourceSubject ? TAHSILI_SUBJECT_ALIASES[sourceSubject] : undefined;
    if (!subject || !TAHSILI_SUBJECTS.has(subject)) {
      return {
        sourceType,
        sourceKey,
        taxonomy,
        prerequisites: [],
        status: 'unmapped',
        reviewReasons: ['missing_or_unrecognized_tahsili_subject'],
        evidence,
        mappingVersion: 'phase-02-v1',
      };
    }

    taxonomy.program = 'tahsili';
    taxonomy.subject = subject;
    evidence.push({ field: 'subject', value: sourceSubject ?? subject, confidence: 'explicit' });
    const topic = nonEmpty(question.topic);
    if (topic) {
      taxonomy.topic = topic;
      evidence.push({ field: 'topic', value: topic, confidence: 'explicit' });
    } else {
      pushReason(reasons, 'topic_not_present_in_source');
    }
  } else {
    const category = nonEmpty(question.category ?? question.subcategory);
    const classification = classifyQudratCategory(category);
    if (!classification.subject) {
      return {
        sourceType,
        sourceKey,
        taxonomy,
        prerequisites: [],
        status: 'unmapped',
        reviewReasons: [classification.reason ?? 'missing_subject'],
        evidence,
        mappingVersion: 'phase-02-v1',
      };
    }

    taxonomy.program = 'qudrat';
    taxonomy.subject = classification.subject;
    evidence.push({
      field: 'category',
      value: category!,
      confidence: 'controlled',
    });

    if (category) {
      taxonomy.topic = category;
      evidence.push({ field: 'topic', value: category, confidence: 'candidate' });
      pushReason(reasons, 'source_category_needs_topic_review');
    }
  }

  const difficulty = nonEmpty(question.difficulty);
  const normalizedDifficulty = difficulty && DIFFICULTIES.has(difficulty)
    ? (difficulty as 'beginner' | 'intermediate' | 'advanced')
    : undefined;
  if (difficulty && !normalizedDifficulty) {
    pushReason(reasons, 'difficulty_needs_normalization');
  } else if (!difficulty) {
    pushReason(reasons, 'difficulty_not_present_in_source');
  }

  if (!taxonomy.skill) pushReason(reasons, 'skill_not_present_in_source');
  if (!taxonomy.subSkill) pushReason(reasons, 'subSkill_not_present_in_source');
  if (!taxonomy.concept) pushReason(reasons, 'concept_not_present_in_source');
  pushReason(reasons, 'no_prerequisite_evidence');

  return {
    sourceType,
    sourceKey,
    taxonomy,
    difficulty: normalizedDifficulty,
    prerequisites: [],
    status: reasons.length > 0 ? 'needs_review' : 'mapped',
    reviewReasons: reasons,
    evidence,
    mappingVersion: 'phase-02-v1',
  };
}

export function summarizeMappings(mappings: QuestionMappingCandidate[]) {
  return mappings.reduce(
    (summary, mapping) => {
      summary.total += 1;
      summary.byStatus[mapping.status] += 1;
      if (mapping.taxonomy.program) summary.byProgram[mapping.taxonomy.program] += 1;
      if (mapping.taxonomy.subject) {
        summary.bySubject[mapping.taxonomy.subject] =
          (summary.bySubject[mapping.taxonomy.subject] ?? 0) + 1;
      }
      return summary;
    },
    {
      total: 0,
      byStatus: { mapped: 0, needs_review: 0, unmapped: 0 } as Record<LearningMappingStatus, number>,
      byProgram: { qudrat: 0, tahsili: 0 } as Record<LearningProgram, number>,
      bySubject: {} as Record<string, number>,
    },
  );
}
