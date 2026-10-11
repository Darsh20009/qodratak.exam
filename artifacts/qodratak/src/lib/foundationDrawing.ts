export type FoundationPoint = { x: number; y: number; pressure?: number };

export function canStartFoundationStroke(
  tool: string,
  pointer: { pointerType: string; button: number; isPrimary: boolean },
): boolean {
  return tool === "PEN" && pointer.isPrimary
    && ["mouse", "touch", "pen"].includes(pointer.pointerType)
    && pointer.button === 0;
}

export function appendFoundationPoint(points: FoundationPoint[], point: FoundationPoint): void {
  const last = points.at(-1);
  if (last?.x === point.x && last?.y === point.y) return;
  points.push(point);
  // Keep the endpoint and stay below the existing API's 1,200-point limit.
  if (points.length > 1100) {
    const endpoint = points.at(-1)!;
    const reduced = points.filter((_, index) => index % 2 === 0);
    if (reduced.at(-1) !== endpoint) reduced.push(endpoint);
    points.splice(0, points.length, ...reduced);
  }
}

export function foundationStrokePayload(points: FoundationPoint[]): FoundationPoint[] {
  const rounded = points.map((point) => ({
    x: Math.round(point.x * 100_000) / 100_000,
    y: Math.round(point.y * 100_000) / 100_000,
    ...(point.pressure === undefined ? {} : { pressure: Math.round(point.pressure * 100_000) / 100_000 }),
  }));
  // A tap is a dot, not a discarded stroke. The API requires two points.
  return rounded.length === 1 ? [rounded[0], { ...rounded[0] }] : rounded;
}
