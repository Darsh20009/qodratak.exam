import { useEffect, useState } from "react";
import { preparationPreferenceKey, readPreparationPreferences, type PreparationPreferences } from "@/lib/preparationStart";

function storage() {
  try { return window.localStorage; } catch { return undefined; }
}
export function usePreparationPreferences(uid: unknown) {
  const [snapshot, setSnapshot] = useState(() => ({ uid, value: readPreparationPreferences(storage(), uid) }));
  useEffect(() => {
    const refresh = () => setSnapshot({ uid, value: readPreparationPreferences(storage(), uid) });
    refresh();
    const changed = (event: StorageEvent) => {
      if (event.key === null || event.key === preparationPreferenceKey(uid)) refresh();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [uid]);
  const preferences = snapshot.uid === uid ? snapshot.value : readPreparationPreferences(storage(), uid);
  const updatePreferences = (patch: Partial<PreparationPreferences>) => {
    const next = { ...preferences, ...patch };
    setSnapshot({ uid, value: next });
    if (uid) {
      // Storage can be unavailable in private/embedded browsers; the current choice still works.
      try { storage()?.setItem(preparationPreferenceKey(uid), JSON.stringify(next)); } catch { /* Non-authoritative preference only. */ }
    }
  };
  return { preferences, updatePreferences };
}
