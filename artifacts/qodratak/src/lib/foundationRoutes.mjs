const supportedPrograms = new Set(["qudrat", "tahsili"]);

function resolveProgram(program, subjectId) {
  if (supportedPrograms.has(program)) return program;
  const match = /^subject\.(qudrat|tahsili)\./.exec(subjectId || "");
  return match?.[1];
}

export function foundationHrefForScope(program, subjectId) {
  const routeProgram = resolveProgram(program, subjectId);
  if (!routeProgram) return "/foundation";

  const params = new URLSearchParams({ program: routeProgram });
  const subjectPrefix = `subject.${routeProgram}.`;
  if (subjectId?.startsWith(subjectPrefix)) {
    const subject = subjectId.slice(subjectPrefix.length);
    if (subject) params.set("subject", subject);
  }

  return `/foundation?${params.toString()}`;
}

export function todayLearningHref(program, subjectId) {
  const routeProgram = resolveProgram(program, subjectId);
  const params = new URLSearchParams();
  if (routeProgram) params.set("programId", routeProgram);

  const subjectPrefix = routeProgram ? `subject.${routeProgram}.` : "";
  if (subjectPrefix && subjectId?.startsWith(subjectPrefix)) {
    params.set("subjectId", subjectId);
  }

  const query = params.toString();
  return query ? `/learning/today?${query}` : "/learning/today";
}