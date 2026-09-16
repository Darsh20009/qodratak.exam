import {
  classifyQuestion,
  type LearningMappingEvidence,
  type LearningMappingStatus,
  type LearningProgram,
  type LearningSourceType,
} from './contentMap';

export type TaxonomyNodeType =
  | 'PROGRAM'
  | 'SUBJECT'
  | 'TOPIC'
  | 'SKILL'
  | 'SUBSKILL'
  | 'CONCEPT';

export type TaxonomyNodeStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
export type MappingConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaxonomyEvidence {
  source: string;
  evidence: string;
  confidence: MappingConfidence;
}

export interface TaxonomyRegistryNode {
  code: string;
  name: string;
  nameAr: string;
  type: TaxonomyNodeType;
  parentId?: string;
  program: LearningProgram;
  subject?: string;
  status: TaxonomyNodeStatus;
  source: string;
  evidence: TaxonomyEvidence[];
  aliases?: string[];
}

export interface ControlledSampleQuestion {
  sampleId: string;
  sourceType: LearningSourceType;
  sourceNamespace: string;
  questionId: number;
  source: string;
  question: Record<string, unknown>;
  topicCode?: string;
}

export interface ControlledSampleMapping {
  sampleId: string;
  source: string;
  sourceType: LearningSourceType;
  sourceKey: string;
  questionId: number;
  taxonomy: {
    program?: string;
    subject?: string;
    topic?: string;
    skill?: string;
    subSkill?: string;
    concept?: string;
  };
  evidence: TaxonomyEvidence[];
  confidence: MappingConfidence;
  reviewStatus: TaxonomyNodeStatus;
  mappingStatus: LearningMappingStatus;
  reviewReasons: string[];
  mappingVersion: string;
}

const sourceBank = 'artifacts/api-server/server/questions.json';
const tahsiliBank = 'artifacts/api-server/src/data/comprehensive-questions-bank.json';

const evidence = (
  source: string,
  value: string,
  confidence: MappingConfidence,
): TaxonomyEvidence[] => [{ source, evidence: value, confidence }];

export const CONTROLLED_TAXONOMY_VERSION = 'phase-03-v1';

/**
 * This is intentionally a small, reviewable registry slice. Program and
 * subject nodes are approved only where the source system has an explicit,
 * controlled label. Source categories are proposed as REVIEW topics and are
 * not treated as approved skills or concepts.
 */
export const CONTROLLED_TAXONOMY_NODES: TaxonomyRegistryNode[] = [
  {
    code: 'program.qudrat',
    name: 'Qudrat',
    nameAr: 'قدرات',
    type: 'PROGRAM',
    program: 'qudrat',
    status: 'APPROVED',
    source: 'platform_programs',
    evidence: evidence('platform_programs', 'The source bank is a Qudrat question bank.', 'HIGH'),
  },
  {
    code: 'program.tahsili',
    name: 'Tahsili',
    nameAr: 'تحصيلي',
    type: 'PROGRAM',
    program: 'tahsili',
    status: 'APPROVED',
    source: 'comprehensive-questions-bank.systemCategory',
    evidence: evidence(tahsiliBank, 'systemCategory=tahsili', 'HIGH'),
  },
  {
    code: 'subject.qudrat.verbal',
    name: 'Verbal',
    nameAr: 'لفظي',
    type: 'SUBJECT',
    parentId: 'program.qudrat',
    program: 'qudrat',
    subject: 'verbal',
    status: 'APPROVED',
    source: sourceBank,
    evidence: evidence(sourceBank, 'Controlled verbal category set', 'HIGH'),
  },
  {
    code: 'subject.qudrat.quantitative',
    name: 'Quantitative',
    nameAr: 'كمي',
    type: 'SUBJECT',
    parentId: 'program.qudrat',
    program: 'qudrat',
    subject: 'quantitative',
    status: 'APPROVED',
    source: sourceBank,
    evidence: evidence(sourceBank, 'Controlled quantitative category set', 'HIGH'),
  },
  ...([
    ['math', 'Mathematics', 'رياضيات', 'الرياضيات'],
    ['physics', 'Physics', 'فيزياء', 'الفيزياء'],
    ['chemistry', 'Chemistry', 'كيمياء', 'الكيمياء'],
    ['biology', 'Biology', 'أحياء', 'الأحياء'],
    ['environment', 'Environmental Science', 'علم البيئة', 'علم البيئة'],
  ] as const).map(([code, name, nameAr, sourceLabel]): TaxonomyRegistryNode => ({
    code: `subject.tahsili.${code}`,
    name,
    nameAr,
    type: 'SUBJECT',
    parentId: 'program.tahsili',
    program: 'tahsili',
    subject: nameAr,
    status: 'APPROVED',
    source: tahsiliBank,
    evidence: evidence(tahsiliBank, `Explicit source subject: ${sourceLabel}`, 'HIGH'),
  })),
  {
    code: 'topic.qudrat.verbal.reading-comprehension',
    name: 'Reading Comprehension',
    nameAr: 'استيعاب المقروء',
    type: 'TOPIC',
    parentId: 'subject.qudrat.verbal',
    program: 'qudrat',
    subject: 'verbal',
    status: 'REVIEW',
    source: sourceBank,
    evidence: evidence(sourceBank, 'Source category: استيعاب المقروء', 'MEDIUM'),
    aliases: ['استيعاب المقروء'],
  },
  {
    code: 'topic.qudrat.quantitative.geometry',
    name: 'Geometry',
    nameAr: 'الهندسة',
    type: 'TOPIC',
    parentId: 'subject.qudrat.quantitative',
    program: 'qudrat',
    subject: 'quantitative',
    status: 'REVIEW',
    source: sourceBank,
    evidence: evidence(sourceBank, 'Source category: الهندسة', 'MEDIUM'),
    aliases: ['الهندسة'],
  },
];

export const CONTROLLED_SAMPLE_QUESTIONS: ControlledSampleQuestion[] = [
  {
    sampleId: 'qudrat-verbal-1',
    sourceType: 'legacy_json',
    sourceNamespace: 'qudrat-verbal',
    questionId: 1,
    source: sourceBank,
    question: { id: 1, sourceNamespace: 'qudrat-verbal', category: 'استيعاب المقروء' },
    topicCode: 'topic.qudrat.verbal.reading-comprehension',
  },
  {
    sampleId: 'qudrat-quantitative-1',
    sourceType: 'legacy_json',
    sourceNamespace: 'qudrat-quantitative',
    questionId: 1,
    source: sourceBank,
    question: { id: 1, sourceNamespace: 'qudrat-quantitative', category: 'الهندسة' },
    topicCode: 'topic.qudrat.quantitative.geometry',
  },
  {
    sampleId: 'tahsili-math-7',
    sourceType: 'legacy_json',
    sourceNamespace: 'tahsili-comprehensive',
    questionId: 7,
    source: tahsiliBank,
    question: { id: 7, sourceNamespace: 'tahsili-comprehensive', category: 'الرياضيات', systemCategory: 'tahsili', difficulty: 'beginner' },
  },
  {
    sampleId: 'tahsili-physics-1',
    sourceType: 'legacy_json',
    sourceNamespace: 'tahsili-comprehensive',
    questionId: 1,
    source: tahsiliBank,
    question: { id: 1, sourceNamespace: 'tahsili-comprehensive', category: 'الفيزياء', systemCategory: 'tahsili', difficulty: 'beginner' },
  },
  {
    sampleId: 'tahsili-chemistry-3',
    sourceType: 'legacy_json',
    sourceNamespace: 'tahsili-comprehensive',
    questionId: 3,
    source: tahsiliBank,
    question: { id: 3, sourceNamespace: 'tahsili-comprehensive', category: 'الكيمياء', systemCategory: 'tahsili', difficulty: 'beginner' },
  },
  {
    sampleId: 'tahsili-biology-5',
    sourceType: 'legacy_json',
    sourceNamespace: 'tahsili-comprehensive',
    questionId: 5,
    source: tahsiliBank,
    question: { id: 5, sourceNamespace: 'tahsili-comprehensive', category: 'الأحياء', systemCategory: 'tahsili', difficulty: 'beginner' },
  },
];

function subjectNodeCode(program: LearningProgram, subject: string): string {
  if (program === 'qudrat') return `subject.qudrat.${subject}`;
  const aliases: Record<string, string> = {
    رياضيات: 'math',
    فيزياء: 'physics',
    كيمياء: 'chemistry',
    أحياء: 'biology',
    'علم البيئة': 'environment',
  };
  return `subject.tahsili.${aliases[subject] ?? subject}`;
}

function mappingConfidence(status: LearningMappingStatus, hasTopic: boolean): MappingConfidence {
  if (status === 'unmapped') return 'LOW';
  return hasTopic ? 'MEDIUM' : 'HIGH';
}

export function buildControlledSampleMappings(): ControlledSampleMapping[] {
  return CONTROLLED_SAMPLE_QUESTIONS.map((sample) => {
    const candidate = classifyQuestion(sample.question, sample.sourceType);
    const programCode = candidate.taxonomy.program
      ? `program.${candidate.taxonomy.program}`
      : undefined;
    const subjectCode = candidate.taxonomy.program && candidate.taxonomy.subject
      ? subjectNodeCode(candidate.taxonomy.program, candidate.taxonomy.subject)
      : undefined;
    const mappedEvidence = candidate.evidence.map((item: LearningMappingEvidence) => ({
      source: sample.source,
      evidence: `${item.field}=${item.value}`,
      confidence: item.confidence === 'explicit' ? 'HIGH' : item.confidence === 'controlled' ? 'HIGH' : 'MEDIUM',
    } satisfies TaxonomyEvidence));

    return {
      sampleId: sample.sampleId,
      source: sample.source,
      sourceType: sample.sourceType,
      sourceKey: candidate.sourceKey,
      questionId: sample.questionId,
      taxonomy: {
        program: programCode,
        subject: subjectCode,
        topic: sample.topicCode,
        skill: undefined,
        subSkill: undefined,
        concept: undefined,
      },
      evidence: mappedEvidence,
      confidence: mappingConfidence(candidate.status, Boolean(sample.topicCode)),
      reviewStatus: 'REVIEW',
      mappingStatus: candidate.status,
      reviewReasons: candidate.reviewReasons,
      mappingVersion: CONTROLLED_TAXONOMY_VERSION,
    };
  });
}