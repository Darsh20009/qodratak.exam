import React, { useCallback, useContext, useMemo, useState, useLayoutEffect } from "react";
import { bindExamTimingOwner } from '@/lib/examTiming';
import { useUser } from "@/hooks/use-user";
import { StudentExamChromeContext } from "@/components/student/StudentExamChromeContext";
import { StudentNavigation } from "@/components/student/StudentNavigation";
import { StudentHeaderTools } from "@/components/student/StudentHeaderTools";

export function StudentShell({ children }: { children: React.ReactNode }) {
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
      <div className="flex min-h-[100dvh] flex-col md:flex-row" dir="rtl">
        <StudentNavigation hidden={isExamLayoutActive || user?.role !== "student"} />
        <div className="flex min-w-0 flex-1 flex-col">
          {!isExamLayoutActive && user?.role === "student" && (
            <header
              dir="rtl"
              data-testid="student-desktop-header"
              className="hidden h-14 shrink-0 items-center justify-end border-b border-border bg-background/95 px-6 backdrop-blur md:flex"
            >
              <StudentHeaderTools />
            </header>
          )}
          <div className="min-h-0 min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </StudentExamChromeContext.Provider>
  );
}
