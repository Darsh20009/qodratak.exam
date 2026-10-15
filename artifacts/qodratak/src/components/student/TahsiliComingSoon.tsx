import type { ReactNode } from 'react';

export function StudentAvailabilityBoundary({ children }: { children: ReactNode }) {
  // Tahsili pages are now available; subscription/trial enforcement remains
  // server-side and is independent of this route-availability wrapper.
  return <>{children}</>;
}
