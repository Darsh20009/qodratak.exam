#!/usr/bin/env python3
"""Small, deterministic per-student logistic model for Qudrat chapter ordering."""

import json
import math
import re
import sys
import unicodedata


CHAPTERS = {
    "quantitative": [
        ("statistics", "الإحصاء وقراءة البيانات"),
        ("arithmetic", "العمليات الحسابية"),
        ("patterns", "الأنماط والمتتابعات"),
        ("ratios", "النسب والتناسب"),
        ("equations", "المعادلات"),
        ("geometry", "الهندسة والقياس"),
        ("percentages", "النسب المئوية"),
        ("mixed", "الأفكار المتنوعة"),
        ("comparisons", "المقارنات وكفاية البيانات"),
    ],
    "verbal": [
        ("vocabulary", "المفردات والمعنى من السياق"),
        ("completion", "إكمال الجمل"),
        ("analogies", "التناظر اللفظي"),
        ("contextual_error", "الخطأ السياقي"),
        ("odd_word", "المفردة الشاذة"),
        ("reading", "استيعاب المقروء"),
        ("inference", "الاستدلال والربط"),
        ("verbal_strategy", "إدارة الاختبار اللفظي"),
    ],
}

ARABIC_MARKS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]")
WORD_PATTERNS = {
    "quantitative": [
        ("statistics", ("احصاء", "احتمال", "احتمالات", "متوسط", "وسيط", "منوال", "مدى", "جدول", "بياني", "رسم")),
        ("arithmetic", ("عملية", "عمليات", "حساب", "ناتج", "كسر", "جذر", "قوى", "عدد")),
        ("patterns", ("نمط", "متتابع", "تتابع", "تسلسل", "حركة")),
        ("ratios", ("نسبة", "تناسب", "معدل", "سرعة", "مقياس")),
        ("equations", ("جبر", "معادلة", "معادلات", "المعادلات", "مجهول", "س=", "قيمة س", "حل المعادلة")),
        ("geometry", ("زاوية", "مثلث", "دائرة", "مساحة", "محيط", "مربع", "هندسة")),
        ("percentages", ("مئوية", "خصم", "ربح", "زيادة", "انخفاض", "ضريبة")),
        ("comparisons", ("قارن", "كفاية", "العمود الأول", "العمود الثاني")),
    ],
    "verbal": [
        ("reading", ("استيعاب", "مقروء", "قطعة", "النص التالي", "الفقرة")),
        ("completion", ("أكمل", "اكمل", "فراغ", "إكمال الجمل", "الجملة الناقصة")),
        ("analogies", ("تناظر", "علاقة", "يقابل", "يرتبط بـ", "علاقة مشابهة")),
        ("contextual_error", ("خطأ سياقي", "السياقي", "غير مناسبة للسياق", "كلمة لا تلائم")),
        ("odd_word", ("شاذ", "المختلفة", "الزائدة", "الكلمة الدخيلة", "المفردة المختلفة")),
        ("vocabulary", ("مرادف", "ضد", "معنى", "مفردة", "مقصود الكلمة")),
        ("inference", ("استنتج", "يستنتج", "الفكرة الرئيسة", "يدل النص", "يستدل")),
    ],
}


def normalize(value):
    value = unicodedata.normalize("NFKC", str(value or "")).lower()
    value = ARABIC_MARKS.sub("", value)
    value = value.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def classify_skill(subject, attempt):
    if attempt.get("skillKey") in {key for key, _ in CHAPTERS[subject]}:
        return attempt["skillKey"]
    text = normalize(" ".join(str(attempt.get(field, "")) for field in (
        "category", "subcategory", "topic", "keywords", "text"
    )))
    for key, terms in WORD_PATTERNS[subject]:
        if any(normalize(term) in text for term in terms):
            return key
    return "mixed" if subject == "quantitative" else "verbal_strategy"


def difficulty_key(value):
    value = normalize(value)
    if any(token in value for token in ("beginner", "easy", "مبتدئ", "سهل", "اساسي")):
        return "beginner"
    if any(token in value for token in ("advanced", "hard", "متقدم", "صعب")):
        return "advanced"
    return "intermediate"


def sigmoid(value):
    if value >= 0:
        z = math.exp(-min(value, 35))
        return 1 / (1 + z)
    z = math.exp(max(value, -35))
    return z / (1 + z)


def feature_vector(subject, attempt=None, skill_override=None):
    attempt = attempt or {}
    skill_keys = [key for key, _ in CHAPTERS[subject]]
    skill = skill_override or classify_skill(subject, attempt)
    difficulty = difficulty_key(attempt.get("difficulty"))
    response_time = max(0, min(float(attempt.get("responseTime") or 0), 600))
    return (
        [1.0]
        + [1.0 if skill == key else 0.0 for key in skill_keys]
        + [1.0 if difficulty == key else 0.0 for key in ("beginner", "intermediate", "advanced")]
        + [1.0 if response_time and response_time < 20 else 0.0,
           1.0 if response_time > 90 else 0.0]
    )


def fit_model(subject, attempts):
    skill_count = len(CHAPTERS[subject])
    width = 1 + skill_count + 5
    weights = [0.0] * width
    labels = []
    for attempt in attempts:
        if attempt.get("isCorrect") is None:
            continue
        age_days = max(0.0, min(float(attempt.get("ageDays") or 0), 3650))
        sample_weight = max(0.2, math.exp(-age_days / 150))
        labels.append((feature_vector(subject, attempt), 1.0 if attempt["isCorrect"] else 0.0, sample_weight))

    if not labels:
        return weights, 0

    # L2-regularized logistic regression trained only on this student's verified attempts.
    learning_rate = 0.12
    regularization = 0.08
    for _ in range(220):
        gradient = [0.0] * width
        total_weight = 0.0
        for vector, target, sample_weight in labels:
            probability = sigmoid(sum(w * x for w, x in zip(weights, vector)))
            error = (probability - target) * sample_weight
            total_weight += sample_weight
            for index, value in enumerate(vector):
                gradient[index] += error * value
        denominator = max(total_weight, 1.0)
        for index in range(width):
            penalty = 0.0 if index == 0 else regularization * weights[index]
            weights[index] -= learning_rate * (gradient[index] / denominator + penalty)
    return weights, len(labels)


def main():
    request = json.load(sys.stdin)
    subject_id = str(request.get("subjectId", ""))
    subject = "verbal" if subject_id.endswith(".verbal") else "quantitative"
    attempts = request.get("attempts") if isinstance(request.get("attempts"), list) else []
    chapters = CHAPTERS[subject]
    weights, attempt_count = fit_model(subject, attempts)
    raw_attempts = [row for row in attempts if row.get("isCorrect") is not None]
    overall = sum(bool(row["isCorrect"]) for row in raw_attempts) / len(raw_attempts) if raw_attempts else 0.5

    recommendations = []
    for order, (skill_key, title) in enumerate(chapters):
        vector = feature_vector(subject, skill_override=skill_key)
        probability = sigmoid(sum(w * x for w, x in zip(weights, vector))) if attempt_count else 0.5
        skill_attempts = [
            row for row in raw_attempts if classify_skill(subject, row) == skill_key
        ]
        confidence = min(0.92, len(skill_attempts) / 10)
        if len(skill_attempts) >= 3:
            reason = "بناءً على إجاباتك السابقة في هذا النوع."
        elif attempt_count:
            reason = "تقدير أولي من أدائك العام؛ نحتاج محاولات أكثر لهذا الباب."
        else:
            reason = "ابدأ بهذا الباب؛ لم تُجمع محاولات كافية لتخصيص المسار بعد."
        recommendations.append({
            "skillKey": skill_key,
            "title": title,
            "predictedCorrectProbability": round(probability, 3),
            "confidence": round(confidence, 3),
            "reason": reason,
            "_order": order,
        })

    if attempt_count < 4:
        recommendations.sort(key=lambda item: item["_order"])
    else:
        recommendations.sort(key=lambda item: (item["predictedCorrectProbability"], item["_order"]))
    for item in recommendations:
        item.pop("_order", None)

    level = "STARTER" if attempt_count < 8 else (
        "BUILDING" if overall < 0.45 else
        "DEVELOPING" if overall < 0.72 else
        "READY"
    )
    print(json.dumps({
        "modelVersion": "student-skill-logistic-v1",
        "attemptsUsed": attempt_count,
        "level": level,
        "recommendations": recommendations,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()