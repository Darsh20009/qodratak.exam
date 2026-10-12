/** Per-question feedback is not a completed exam or a completed timing run. */
export function isExamSubmission(method: string, url: string): boolean {
  const path = url.split("?")[0];
  return method.toUpperCase() === "POST" &&
    !/\/adaptive\/submit$/.test(path) &&
    /\/(?:test-results|submit|finish)$/.test(path) &&
    !path.includes("/exam-reports");
}

export function isExamRosterComplete(answeredQuestions: number, requiredQuestions: number): boolean {
  return requiredQuestions > 0 && answeredQuestions >= requiredQuestions;
}
