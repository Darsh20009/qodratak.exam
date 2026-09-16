# Learning Engine Content Map — Phase 02

**Phase:** CONTENT & SKILL MAP FOUNDATION  
**Date:** 2026-09-16  
**Scope:** Content taxonomy, question-mapping foundation, and database design only.

## CURRENT CONTENT STRUCTURE

### Repository-visible reference sources

The audit used the two readable, non-duplicated reference banks already present in the repository:

| Source | Role | Questions counted |
|---|---|---:|
| `artifacts/api-server/server/questions.json` | Legacy Qudrat question bank | 2,263 |
| `artifacts/api-server/src/data/comprehensive-questions-bank.json` | Generated Tahsili bank | 270 |
| **Total** | Repository-visible inventory | **2,533** |

The three similarly named files under `artifacts/api-server/attached_assets` were not counted as an independent bank. They contain a leading `z` and are malformed JSON at a later position, so they are retained as source artifacts but excluded from automatic mapping. They require a separate data-cleaning/review decision.

This is a repository inventory, not a live MongoDB count. No production or development database data was queried or changed in Phase 02.

### Existing Qudrat fields

The legacy Qudrat file has:

- Numeric `id`.
- Arabic `category`.
- Question text.
- Options.
- Correct option index.
- Explanation in some records.

It does not consistently have:

- `program`.
- `subject`.
- `topic`.
- `skill`.
- `subSkill`.
- `concept`.
- `difficulty`.
- `prerequisites`.

The current Mongo `Question` model is richer than this legacy file and already has `category`, `subcategory`, `topic`, `difficulty`, `keywords`, explanation, and image metadata. Those fields are reusable evidence, but they do not replace a canonical taxonomy.

### Existing Qudrat categories

#### Verbal — 588 questions

- استيعاب المقروء — 61
- التناظر اللفظي — 197
- الخطأ السياقي — 87
- إكمال الجمل — 93
- المفردة المختلفة — 150

#### Quantitative — 1,498 questions

- الهندسة — 173
- عمليات حسابية — 138
- النسبة المئوية — 172
- المقارنات — 275
- الحركة والأنماط — 147
- النسبة والتناسب — 129
- الإحصاء — 139
- المعادلات — 263
- العمليات الحسابية — 62

`عمليات حسابية` and `العمليات الحسابية` are kept as separate source labels. They may be aliases, but this phase does not merge them without evidence.

#### Ambiguous — 177 questions

- أفكار متنوعة — 177

This category is intentionally not assigned to verbal or quantitative. It is **Unmapped** until an admin or content reviewer can provide evidence.

### Existing Tahsili fields

The generated Tahsili bank has:

- Numeric `id`.
- Arabic subject-like `category`.
- `systemCategory: tahsili`.
- Question text and options.
- Correct option index.
- Explanation and hint.
- `difficulty`.
- Source title.

It does not contain a reliable topic, skill, subSkill, concept, or prerequisite field.

### Existing Tahsili subjects

| Source label | Canonical subject | Questions |
|---|---|---:|
| الفيزياء | فيزياء | 54 |
| الكيمياء | كيمياء | 54 |
| الأحياء | أحياء | 54 |
| الرياضيات | رياضيات | 50 |
| علم البيئة | علم البيئة | 58 |

`علم البيئة` exists in the current source even though the requested future architecture explicitly names mathematics, physics, chemistry, and biology. It is preserved as an observed source subject and marked for curriculum alignment review; it is not deleted or silently moved.

### Existing content that can be reused

- Mongo `Question` metadata and explanation fields.
- Mongo `TahsiliQuestion` subject, subcategory, topic, difficulty, and review-confidence fields.
- Existing `FoundationContent` program/order/published fields and linked quiz references.
- Existing question reports and admin question-management flows.
- Existing `ErrorLog` category/subcategory fields as historical evidence only.
- Existing `AdaptiveProfile` subcategory labels as historical evidence only.
- Existing `TestResult` weak/strong areas as historical evidence only.
- Existing category labels in the readable JSON banks.

Historical performance fields are not used to infer the content taxonomy in this phase.

---

## PROPOSED CONTENT HIERARCHY

The target hierarchy is:

```text
Program
└── Subject
    └── Topic
        └── Skill
            └── SubSkill
                └── Concept
                    └── Question
```

The implementation stores taxonomy nodes in one extensible `LearningContentNode` collection rather than creating six almost-identical collections. The `nodeType` field identifies the level, and `parentCode` expresses the hierarchy.

### Stable node requirements

Every node should have:

- Stable `code`.
- `nodeType`.
- `program`.
- `parentCode` where applicable.
- Arabic `title`.
- URL-safe `slug`.
- Publication/review `status`.
- Original `sourceLabels`.
- Explicit `prerequisiteCodes`.
- Optional future metadata such as estimated time.

### Safe initial nodes

The current implementation supports these node types and does not seed invented deep content:

- `program`: `qudrat`, `tahsili`.
- `subject`: `verbal`, `quantitative`, and observed Tahsili subjects.
- `topic`: source categories may become candidate topic labels, but remain reviewable.
- `skill`, `subSkill`, `concept`: supported by schema, not fabricated from current labels.

No complete curriculum was invented where the repository does not provide it.

---

## VERBAL SKILL MAP

The source provides five usable verbal category labels. They are currently represented as safe subject/category evidence, not as a fully approved skill tree.

```text
قدرات
└── لفظي
    ├── استيعاب المقروء
    ├── التناظر اللفظي
    ├── الخطأ السياقي
    ├── إكمال الجمل
    └── المفردة المختلفة
```

### Current status

| Level | State |
|---|---|
| Program | Confirmed as Qudrat for recognized legacy categories |
| Subject | Confirmed as verbal |
| Source category/topic candidate | Preserved as candidate evidence |
| Skill | Not present in the source |
| SubSkill | Not present in the source |
| Concept | Not present in the source |
| Prerequisites | No evidence in the source |

Examples such as “relationship of part to whole” or a specific reading-comprehension skill are intentionally not added until they are present in the content or approved by a reviewer.

---

## QUANTITATIVE SKILL MAP

The source provides nine quantitative category labels:

```text
قدرات
└── كمي
    ├── الهندسة
    ├── عمليات حسابية
    ├── النسبة المئوية
    ├── المقارنات
    ├── الحركة والأنماط
    ├── النسبة والتناسب
    ├── الإحصاء
    ├── المعادلات
    └── العمليات الحسابية
```

### Current status

| Level | State |
|---|---|
| Program | Confirmed as Qudrat for recognized legacy categories |
| Subject | Confirmed as quantitative |
| Source category/topic candidate | Preserved as candidate evidence |
| Skill | Not present in the source |
| SubSkill | Not present in the source |
| Concept | Not present in the source |
| Prerequisites | No evidence in the source |

For example, the system does not infer “percentage increase/decrease” from `النسبة المئوية`, and does not infer “addition of fractions” from an absent fraction label. Those are valid future taxonomy candidates, not current mappings.

---

## ACHIEVEMENT ARCHITECTURE

This section covers the current and future **Tahsili** architecture.

```text
تحصيلي
├── رياضيات
├── فيزياء
├── كيمياء
├── أحياء
└── علم البيئة (observed source subject; curriculum review required)
```

The schema supports:

```text
Subject
└── Topic
    └── Skill
        └── SubSkill
            └── Concept
                └── Question
```

The current readable Tahsili bank supports only:

- Program through `systemCategory`.
- Subject through the Arabic `category`, with safe alias normalization for `الفيزياء` → `فيزياء`, etc.
- Difficulty where present.
- Explanation/hint as reusable learning evidence.

It does not support a defensible deep subject map yet. All 270 Tahsili questions are therefore `Needs Review`, not `Mapped`.

The existing Mongo `TahsiliQuestion` collection remains separate and is not replaced. Its verified/review answer-confidence boundary is preserved.

---

## QUESTION MAPPING STRATEGY

### Mapping statuses

| Status | Meaning |
|---|---|
| `mapped` | All required levels are supported by explicit or approved source evidence |
| `needs_review` | A safe higher-level mapping exists, but one or more deeper levels are missing or only candidates |
| `unmapped` | The source cannot safely identify even the required program/subject path |

### Evidence rules

1. Prefer explicit fields from the source.
2. Normalize only controlled aliases, such as Arabic definite articles on Tahsili subject labels.
3. Do not turn a free-text category into a Skill or Concept automatically.
4. Do not infer prerequisites from category ordering.
5. Preserve the original source label alongside any canonical code.
6. Keep ambiguous labels Unmapped.
7. Keep a mapping version so later review can be compared to the original candidate.

### Implemented mapper

`artifacts/api-server/src/learning/contentMap.ts` provides:

- Controlled Qudrat verbal/quantitative category sets.
- Controlled Tahsili subject aliases.
- Difficulty normalization for `beginner`, `intermediate`, and `advanced`.
- Mapping candidates with taxonomy path, evidence, review reasons, status, and version.
- Summary counts by status, program, and subject.

The mapper does not write to MongoDB and does not alter a question record.

### Repository-visible mapping result

| Source | Total | Needs Review | Unmapped | Fully Mapped |
|---|---:|---:|---:|---:|
| Qudrat legacy bank | 2,263 | 2,086 | 177 | 0 |
| Tahsili comprehensive bank | 270 | 270 | 0 | 0 |
| **Total** | **2,533** | **2,356** | **177** | **0** |

The 2,356 safe classifications are:

- 2,086 Qudrat questions:
  - 588 verbal.
  - 1,498 quantitative.
- 270 Tahsili questions:
  - 54 physics.
  - 54 chemistry.
  - 54 biology.
  - 50 mathematics.
  - 58 environmental science.

“Classified” in this report means classified at the highest evidence-supported level, not fully mapped to Concept.

### Reasons for Needs Review

The implemented report preserves explicit reasons such as:

- `topic_not_present_in_source`.
- `source_category_needs_topic_review`.
- `skill_not_present_in_source`.
- `subSkill_not_present_in_source`.
- `concept_not_present_in_source`.
- `difficulty_not_present_in_source`.
- `no_prerequisite_evidence`.

### Unmapped content

The current reference inventory has 177 Unmapped records:

- Source category: `أفكار متنوعة`.
- Reason: `unrecognized_qudrat_category`.

They remain available for later admin review. They are not assigned to verbal, quantitative, or Tahsili.

---

## PREREQUISITE MODEL

Prerequisites are represented by stable taxonomy codes:

```text
LearningContentNode.prerequisiteCodes: string[]
QuestionLearningMap.prerequisites: string[]
```

The implementation does not create any prerequisite edges in Phase 02 because the current content does not prove them.

Future examples may be valid only after evidence review:

```text
الكسور
→ النسب
→ النسبة المئوية
→ الزيادة والنقصان
→ المسائل التطبيقية
```

This is a future candidate shape, not a seeded relationship in the current database.

---

## DATABASE CHANGES

### Added schemas

#### `LearningContentNode`

File: `artifacts/api-server/src/mongodb/learningContentModels.ts`

Purpose:

- Store Program, Subject, Topic, Skill, SubSkill, and Concept nodes in one extensible collection.
- Preserve source labels.
- Support review/publication status.
- Store explicit prerequisite codes.
- Leave room for estimated time without pretending to have student-derived statistics.

#### `QuestionLearningMap`

File: `artifacts/api-server/src/mongodb/learningContentModels.ts`

Purpose:

- Keep question-to-taxonomy mapping separate from the existing question documents.
- Support Mongo Qudrat, Mongo Tahsili, PostgreSQL, and legacy JSON source types.
- Preserve source keys and optional Mongo question references.
- Store taxonomy path, difficulty, evidence, review reasons, status, and mapping version.
- Allow admin review fields without changing answer keys or question delivery.

### Existing schemas not modified

- `Question` was not modified.
- `TahsiliQuestion` was not modified.
- `FoundationContent` was not modified.
- `TestResult`, `ErrorLog`, `AdaptiveProfile`, and `StudentLearningProfile` were not modified.
- No PostgreSQL table was added or modified.

The new model file uses `mongoose.models` reuse guards for development reloads and defines compound indexes for taxonomy lookup and source mapping uniqueness.

---

## MIGRATION PLAN

No migration was executed.

The safe future sequence is:

1. Review the proposed node codes and approve the first taxonomy slice.
2. Create only approved `LearningContentNode` records.
3. Generate `QuestionLearningMap` candidates from the current mapper.
4. Persist candidates with `needs_review`/`unmapped` status, never as silently approved content.
5. Let admin/content reviewers fill Skill, SubSkill, Concept, and prerequisites.
6. Keep original question fields and source IDs unchanged.
7. Reconcile Mongo, PostgreSQL, and legacy IDs before any route begins reading canonical mappings.
8. Add a dual-read or feature-flagged consumer only after mapping coverage and authorization tests exist.
9. Do not delete legacy data or replace existing collections.

The current mapper is intentionally a dry, non-persistent foundation. It can be reviewed and tested without changing the connected dataset.

---

## VALIDATION

### Completed

- Mapper unit tests: **5 passed, 0 failed**.
- API test suite, run with the existing test files expanded by the shell: **17 passed, 0 failed**.
- Qodratak frontend test suite: **8 passed, 0 failed**.
- `git diff --check`: passed.
- The API typecheck command still exits non-zero because of existing repository compile debt. The final run reported 697 TypeScript error lines, but no error was reported from:
  - `src/learning/contentMap.ts`
  - `src/mongodb/learningContentModels.ts`
  - `test/learningContentMap.test.ts`

### Existing validation debt

The root `pnpm run typecheck` also remains non-zero because of pre-existing errors across the API and frontend, including session typing, route parameter narrowing, return paths, missing third-party declarations, and existing UI type mismatches. Phase 02 did not widen that unrelated scope.

There is no `lint` script in the workspace or the touched packages; `pnpm run lint --if-present` reports that the script is missing. The API package's declared `test` script also has a pre-existing quoted-glob issue and fails to locate `test/*.test.ts`; the same tests pass when the glob is expanded directly. No frontend code was touched.

---

## PHASE 03 PROPOSAL

Do not start Student Model, Mastery Engine, Diagnostic, Recommendation Engine, or student-facing AI yet.

The next safe phase should first be a **Content Review & Taxonomy Approval** phase:

1. Approve canonical codes for the observed Qudrat categories and Tahsili subjects.
2. Resolve the 177 `أفكار متنوعة` records.
3. Decide whether duplicate labels `عمليات حسابية` and `العمليات الحسابية` are the same taxonomy node.
4. Add a small, reviewer-approved set of Skill/SubSkill/Concept nodes from existing explanations and content.
5. Review a sample of mappings before bulk persistence.
