import fs from 'fs';
import path from 'path';

const questionsFile = path.join(process.cwd(), 'server', 'questions.json');
const outputFile = path.join(process.cwd(), 'server', 'data', 'paper-models.json');

console.log('🎲 Generating 30 STABLE paper models...');

const questionsData = JSON.parse(fs.readFileSync(questionsFile, 'utf-8'));

// Get verbal and quantitative questions from file
const verbalQuestions = questionsData.verbal || [];
const quantQuestions = questionsData.quantitative || [];

console.log(`📊 Available: ${verbalQuestions.length} verbal, ${quantQuestions.length} quantitative`);

// Use seeded random for reproducibility
function seededRandom(seed: number): () => number {
  return function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

// Shuffle with seed for reproducibility
function seededShuffle<T>(array: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function distributeTrialQuestions(questions: any[], trialCount: number, type: string): any[] {
  const total = questions.length;
  const interval = Math.floor(total / trialCount);

  return questions.map((q, idx) => {
    const isTrial = idx % interval === 0 && Math.floor(idx / interval) < trialCount;
    return {
      ...q,
      questionType: type,
      isTrial
    };
  });
}

function mixQuestionsEvenly(verbal: any[], quant: any[]): any[] {
  const mixed: any[] = [];
  const totalVerbal = verbal.length;
  const totalQuant = quant.length;
  const totalQuestions = totalVerbal + totalQuant;

  let vIdx = 0;
  let qIdx = 0;

  const verbalRatio = totalVerbal / totalQuestions;

  for (let i = 0; i < totalQuestions; i++) {
    const expectedVerbalIdx = Math.floor(i * verbalRatio);
    const expectedQuantIdx = Math.floor(i * (1 - verbalRatio));

    const verbalLagging = vIdx < expectedVerbalIdx;
    const quantLagging = qIdx < expectedQuantIdx;

    if (verbalLagging && vIdx < totalVerbal) {
      mixed.push({ ...verbal[vIdx], position: i + 1 });
      vIdx++;
    } else if (qIdx < totalQuant) {
      mixed.push({ ...quant[qIdx], position: i + 1 });
      qIdx++;
    } else if (vIdx < totalVerbal) {
      mixed.push({ ...verbal[vIdx], position: i + 1 });
      vIdx++;
    }
  }

  return mixed;
}

const numberOfModels = 30;
const models: any[] = [];

// Use different seed for each model to get variety but still deterministic
const shuffledVerbal = seededShuffle(verbalQuestions, 12345); // Fixed seed
const shuffledQuant = seededShuffle(quantQuestions, 67890); // Fixed seed

for (let i = 0; i < numberOfModels; i++) {
  console.log(`📝 Generating model ${i + 1}...`);
  
  // Get questions for this model
  const modelVerbal = shuffledVerbal.slice(i * 65, (i + 1) * 65);
  const modelQuant = shuffledQuant.slice(i * 55, (i + 1) * 55);

  // Smart distribution: spread trial questions evenly
  const verbalWithTrial = distributeTrialQuestions(modelVerbal, 12, 'verbal');
  const quantWithTrial = distributeTrialQuestions(modelQuant, 8, 'quantitative');

  // Mix questions evenly
  const allQuestions = mixQuestionsEvenly(verbalWithTrial, quantWithTrial);

  models.push({
    modelNumber: i + 1,
    name: `النموذج ${i + 1}`,
    allQuestions,
    totalQuestions: 120,
    verbalCount: 65,
    quantitativeCount: 55,
    trialVerbalCount: 12,
    trialQuantCount: 8,
  });
}

// Write to file
fs.writeFileSync(outputFile, JSON.stringify({ models, version: 1, generatedAt: new Date().toISOString() }, null, 2));

console.log(`✅ Generated ${numberOfModels} stable paper models and saved to ${outputFile}`);
console.log('🔒 These models will NEVER change unless manually regenerated');
