import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Home } from "@/pages/Home";
import { ProfilePage } from "@/pages/ProfilePage";
import { QiyasExamPage } from "@/pages/QiyasExamPage";
import { AbilitiesTestPage } from "@/pages/AbilitiesTestPage";
import { AskQuestionPage } from "@/pages/AskQuestionPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { ExamRecordsPage } from "@/pages/ExamRecordsPage";
import { FoldersPage } from "@/pages/FoldersPage";
import { MockExamPage } from "@/pages/MockExamPage";
import { CustomExamPage } from "@/pages/CustomExamPage";
import { ChallengePage } from "@/pages/ChallengePage";
import { QualificationExamPage } from "@/pages/QualificationExamPage";
import { TestResultsPage } from "@/pages/TestResultsPage";
import { NotFound } from "@/pages/not-found";
import { RotateDevicePrompt } from "@/components/RotateDevicePrompt";
import { useState, useEffect } from "react";

function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    setSplashDone(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Router>
            <MainLayout>
              {splashDone && <RotateDevicePrompt />}
              <Route path="/" component={Home} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/qiyas" component={QiyasExamPage} />
              <Route path="/abilities" component={AbilitiesTestPage} />
              <Route path="/ask" component={AskQuestionPage} />
              <Route path="/library" component={LibraryPage} />
              <Route path="/exam-records" component={ExamRecordsPage} />
              <Route path="/folders" component={FoldersPage} />
              <Route path="/mock-exam" component={MockExamPage} />
              <Route path="/custom-exam" component={CustomExamPage} />
              <Route path="/challenge" component={ChallengePage} />
              <Route path="/qualification" component={QualificationExamPage} />
              <Route path="/test-results" component={TestResultsPage} />
              <Route component={NotFound} />
            </MainLayout>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;