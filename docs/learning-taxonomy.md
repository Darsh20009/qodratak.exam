# Learning Taxonomy — Phase 03 Controlled Set

**Phase:** TAXONOMY APPROVAL — FIRST CONTROLLED SET  
**Version:** `phase-03-v1`  
**Scope:** Registry, evidence, review workflow, and a six-question sample only.

This phase does not build Student Model, Mastery, Diagnostic, Recommendation, AI Tutor, iPad UI, or Apple Pencil UI. It does not change the student interface, the original question banks, or production data.

## Taxonomy Principles

1. Existing source labels are **Evidence**, not automatically approved Skill or Concept nodes.
2. A stable code is required for every registry node.
3. `confidence` describes evidence quality; it does not mean `APPROVED`.
4. Missing levels remain empty and the mapping remains `REVIEW` / `NEEDS_REVIEW`.
5. No prerequisite relationship is created without explicit evidence.
6. The controlled set is intentionally small and reviewable.

## Naming Rules

- `name` is the stable English display name.
- `nameAr` preserves the Arabic content label.
- `code` is lowercase, dot-separated, and immutable after creation.
- Aliases are stored separately from the canonical name.
- `عمليات حسابية` and `العمليات الحسابية` remain separate source labels until a reviewer approves a merge.

## Coding Rules

The registry uses these node types:

```text
PROGRAM → SUBJECT → TOPIC → SKILL → SUBSKILL → CONCEPT
```

Examples:

```text
program.qudrat
subject.qudrat.verbal
topic.qudrat.verbal.reading-comprehension
```

There are no Skill, SubSkill, or Concept codes in the first controlled set because the source does not provide reliable evidence for them.

## Status Model

Registry and review statuses are:

| Status | Meaning |
|---|---|
| `DRAFT` | Local proposal not ready for review |
| `REVIEW` | Evidence exists and a reviewer must decide |
| `APPROVED` | Explicitly approved by an authorized reviewer |
| `REJECTED` | Rejected or invalidated by a reviewer |

The first set contains **11 proposed nodes**:

- **9 APPROVED:** 2 programs and 7 explicit subjects.
- **2 REVIEW:** Qudrat source-category topic candidates for reading comprehension and geometry.

Approval of a Program or Subject does not approve any deeper Skill or Concept.

## Evidence Model

Each node and mapping stores:

```text
source
evidence
confidence: HIGH | MEDIUM | LOW
```

`HIGH` is used for explicit program/system or subject fields. `MEDIUM` is used for a source category treated as a topic candidate. `LOW` is reserved for insufficient evidence.

## Review Model

The backend exposes an admin-only review structure under `/api/admin/learning-taxonomy`:

- `GET /controlled-set` — returns the non-persisted controlled set and six-question sample.
- `GET /nodes` — lists persisted registry nodes.
- `POST /nodes` — creates a `REVIEW` candidate; direct `APPROVED` creation is rejected.
- `PATCH /nodes/:id/review` — edits/reviews a persisted node.
- `GET /mappings` — lists persisted question mapping candidates.
- `POST /mappings` — creates a mapping candidate with evidence.
- `PATCH /mappings/:id/review` — approve, reject, or edit a mapping.

The routes use the existing admin session and `manage_content` permission. No admin UI was added because the phase only requires the backend review structure.

## Duplicate Handling

The registry does not merge similar labels silently. Each canonical code must have an explicit evidence record. Aliases may be proposed, but a merge remains `REVIEW` until a human confirms that the labels represent the same concept.

Question source keys include a source namespace. This prevents the verbal question `id=1` and quantitative question `id=1` from colliding in the mapping collection.

## Mapping Rules

For each sample question:

```text
Question → Program → Subject → Topic → Skill → SubSkill → Concept
```

- Program and Subject are mapped when supported by explicit controlled evidence.
- A Qudrat source category may be a `TOPIC` candidate, but remains `REVIEW`.
- A Tahsili subject without a reliable topic remains mapped only to the subject.
- Skill, SubSkill, Concept, and prerequisites remain unset when absent from the source.
- Every sample mapping remains `REVIEW` and `needs_review`; none is silently approved.

## Approved Sample

The sample contains **6 questions**, one for each required path:

| Sample | Source | Supported path | Status |
|---|---|---|---|
| `qudrat-verbal-1` | `server/questions.json`, verbal id 1 | Qudrat → Verbal → Reading Comprehension candidate | REVIEW |
| `qudrat-quantitative-1` | `server/questions.json`, quantitative id 1 | Qudrat → Quantitative → Geometry candidate | REVIEW |
| `tahsili-math-7` | comprehensive bank id 7 | Tahsili → Mathematics | REVIEW |
| `tahsili-physics-1` | comprehensive bank id 1 | Tahsili → Physics | REVIEW |
| `tahsili-chemistry-3` | comprehensive bank id 3 | Tahsili → Chemistry | REVIEW |
| `tahsili-biology-5` | comprehensive bank id 5 | Tahsili → Biology | REVIEW |

### Five complete mapping records

“Complete” here means the full review record is present, including empty unresolved levels; it does not mean the question is fully mapped to Concept.

```json
{
  "sampleId": "qudrat-verbal-1",
  "sourceKey": "legacy_json:qudrat-verbal:1",
  "taxonomy": {
    "program": "program.qudrat",
    "subject": "subject.qudrat.verbal",
    "topic": "topic.qudrat.verbal.reading-comprehension",
    "skill": null,
    "subSkill": null,
    "concept": null
  },
  "confidence": "MEDIUM",
  "reviewStatus": "REVIEW",
  "mappingStatus": "needs_review"
}
```

```json
{
  "sampleId": "qudrat-quantitative-1",
  "sourceKey": "legacy_json:qudrat-quantitative:1",
  "taxonomy": {
    "program": "program.qudrat",
    "subject": "subject.qudrat.quantitative",
    "topic": "topic.qudrat.quantitative.geometry",
    "skill": null,
    "subSkill": null,
    "concept": null
  },
  "confidence": "MEDIUM",
  "reviewStatus": "REVIEW",
  "mappingStatus": "needs_review"
}
```

```json
{
  "sampleId": "tahsili-math-7",
  "sourceKey": "legacy_json:tahsili-comprehensive:7",
  "taxonomy": {
    "program": "program.tahsili",
    "subject": "subject.tahsili.math",
    "topic": null,
    "skill": null,
    "subSkill": null,
    "concept": null
  },
  "confidence": "HIGH",
  "reviewStatus": "REVIEW",
  "mappingStatus": "needs_review"
}
```

```json
{
  "sampleId": "tahsili-physics-1",
  "sourceKey": "legacy_json:tahsili-comprehensive:1",
  "taxonomy": {
    "program": "program.tahsili",
    "subject": "subject.tahsili.physics",
    "topic": null,
    "skill": null,
    "subSkill": null,
    "concept": null
  },
  "confidence": "HIGH",
  "reviewStatus": "REVIEW",
  "mappingStatus": "needs_review"
}
```

```json
{
  "sampleId": "tahsili-chemistry-3",
  "sourceKey": "legacy_json:tahsili-comprehensive:3",
  "taxonomy": {
    "program": "program.tahsili",
    "subject": "subject.tahsili.chemistry",
    "topic": null,
    "skill": null,
    "subSkill": null,
    "concept": null
  },
  "confidence": "HIGH",
  "reviewStatus": "REVIEW",
  "mappingStatus": "needs_review"
}
```

## Unresolved Cases

- All 6 sample mappings need review because Skill, SubSkill, and Concept are not present in the source.
- The two Qudrat topic candidates are source labels, not approved deep taxonomy.
- Tahsili sample questions have explicit subjects but no reliable topics.
- No prerequisites are inferred.
- `أفكار متنوعة` remains Unmapped and is not assigned to Verbal or Quantitative.
- Similar arithmetic labels remain separate until reviewed.

## Database Boundary

The existing Phase 02 `LearningContentNode` collection is the central registry and now exposes canonical `name`, `nameAr`, `type`, `parentId`, `program`, `subject`, `status`, `source`, and `evidence` fields. `QuestionLearningMap` remains the separate question-to-taxonomy review record.

No migration or bulk persistence was run. The controlled set is returned as a reviewable dry set (`persisted: false`) and no production data was changed.