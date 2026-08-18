export async function autoSaveMistakesToFolder(
  wrongQuestionIds: number[],
  testName: string,
  testType?: string
): Promise<void> {
  if (!wrongQuestionIds.length) return;
  try {
    await fetch('/api/folders/auto-mistakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrongQuestionIds, testName, testType }),
    });
  } catch {
    // Silent fail — auto-save is best-effort
  }
}
