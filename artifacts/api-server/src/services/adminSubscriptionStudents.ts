export interface SubscriptionStudent {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
}

export function subscriptionStudentId(value: unknown): string | null {
  let id = value;
  if (value && typeof value === "object" && "toHexString" in value && typeof value.toHexString === "function") {
    id = value.toHexString();
  }
  return typeof id === "string" && /^[a-f0-9]{24}$/i.test(id) ? id.toLowerCase() : null;
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

// Read-only enrichment: never replace a historical financial record's owner ID,
// or guess a modern account from a legacy numeric ID, name, or phone.
export function attachSubscriptionStudents<T extends { userId: unknown }>(
  subscriptions: T[],
  users: Array<{ _id: unknown; fullName?: unknown; username?: unknown; email?: unknown; phone?: unknown }>,
) {
  const students = new Map<string, SubscriptionStudent>();
  for (const user of users) {
    const id = subscriptionStudentId(user._id);
    if (id) students.set(id, {
      _id: id, fullName: text(user.fullName), username: text(user.username),
      email: text(user.email), phone: text(user.phone),
    });
  }
  return subscriptions.map(subscription => {
    const id = subscriptionStudentId(subscription.userId);
    const student = id ? students.get(id) ?? null : null;
    return {
      ...subscription, student,
      studentLinkStatus: student ? "linked" as const : id ? "missing_account" as const : "legacy_identity" as const,
    };
  });
}
