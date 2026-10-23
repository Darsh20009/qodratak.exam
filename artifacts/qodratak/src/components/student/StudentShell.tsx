import React, { useCallback, useContext, useMemo, useState, useLayoutEffect } from "react";
import { bindExamTimingOwner } from '@/lib/examTiming';
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { StudentExamChromeContext } from "@/components/student/StudentExamChromeContext";
import { PageGuideFilm } from "@/components/student/PageGuideFilm";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  useLayoutEffect(() => { bindExamTimingOwner(user?.id ? String(user.id) : null); }, [user?.id]);
  const inheritedExamChrome = useContext(StudentExamChromeContext);
  const [localExamActive, setLocalExamActive] = useState(false);
  const setExamActive = useCallback((active: boolean) => {
    setLocalExamActive(active);
    inheritedExamChrome.setActive(active);
  }, [inheritedExamChrome.setActive]);
  const isExamLayoutActive = localExamActive || inheritedExamChrome.isActive;
  const examChrome = useMemo(
    () => ({ isActive: isExamLayoutActive, setActive: setExamActive }),
    [isExamLayoutActive, setExamActive],
  );

  return (
    <StudentExamChromeContext.Provider value={examChrome}>
      {!isExamLayoutActive && <PageGuideFilm location={location} />}
      {children}
    </StudentExamChromeContext.Provider>
  );
}
