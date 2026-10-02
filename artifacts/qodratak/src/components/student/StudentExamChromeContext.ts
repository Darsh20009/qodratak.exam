import { createContext } from "react";

export type StudentExamChromeContextValue = {
  isActive: boolean;
  setActive: (active: boolean) => void;
};

export const StudentExamChromeContext = createContext<StudentExamChromeContextValue>({
  isActive: false,
  setActive: () => undefined,
});