import assert from 'node:assert/strict';
import test from 'node:test';
import { generateReusableQuestionExplanation } from '../src/services/aiService.ts';

test('reusable explanations include actual image URLs and the source passage; inconsistent keys are rejected',
  { skip: !process.env.OPENAI_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY }, async () => {
    const originalFetch = globalThis.fetch;
    const image = 'https://example.test/source-question.png';
    let requested: any;
    let key = 1;
    globalThis.fetch = (async (_url, init) => {
      requested = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        readable: true, correctOptionIndex: key,
        explanation: 'شرح اختباري طويل بما يكفي لاختبار قبول النص عند تطابق مفتاح الإجابة الموثوق.',
        tip: 'اختصر الحساب فقط بعد فهم المعطيات.',
      }) } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
    try {
      const question = { text: 'سؤال مصور', options: ['أ', 'ب'], correctOptionIndex: 1, imageUrls: [image], source: { passageText: 'القطعة الأصلية الموثوقة' } };
      const accepted = await generateReusableQuestionExplanation(question);
      assert.ok(accepted?.explanation);
      const content = requested.messages[1].content;
      assert.equal(content[1].image_url.url, image);
      assert.ok(content[0].text.includes(question.source.passageText));
      key = 0;
      assert.equal(await generateReusableQuestionExplanation(question), null);
      assert.equal(await generateReusableQuestionExplanation({ ...question, imageUrls: Array(5).fill(image) }), null);
    } finally { globalThis.fetch = originalFetch; }
  });
