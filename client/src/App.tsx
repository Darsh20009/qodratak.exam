import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/MainLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import NewHome from '@/pages/NewHome';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { QiyasExamPage } from '@/pages/QiyasExamPage';
import { MockExamPage } from '@/pages/MockExamPage';
import { CustomExamPage } from '@/pages/CustomExamPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { TimeManagementPage } from '@/pages/TimeManagementPage';
import { AdvancedTimeManagementPage } from '@/pages/AdvancedTimeManagementPage';
import { NewTimeManagementPage } from '@/pages/NewTimeManagementPage';
import { ChallengePage } from '@/pages/ChallengePage';
import { MistakeChallengePage } from '@/pages/MistakeChallengePage';
import { AskQuestionPage } from '@/pages/AskQuestionPage';
import { BooksPage } from '@/pages/BooksPage';
import { InstallPage } from '@/pages/InstallPage';
import { FoldersPage } from '@/pages/FoldersPage';
import { ExamRecordsPage } from '@/pages/ExamRecordsPage';
import { AbilitiesTestPage } from '@/pages/AbilitiesTestPage';
import { VerbalTests } from '@/pages/VerbalTests';
import { VerbalTestRunner } from '@/pages/VerbalTestRunner';
import { QuantitativeTests } from '@/pages/QuantitativeTests';
import { QuantitativeTestRunner } from '@/pages/QuantitativeTestRunner';
import { QualificationExamPage } from '@/pages/QualificationExamPage';
import { SubscriptionPage } from '@/pages/SubscriptionPage';
import { TestResultsPage } from '@/pages/TestResultsPage';
import { GuestSignupPage } from '@/pages/GuestSignupPage';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        {() => <MainLayout><NewHome /></MainLayout>}
      </Route>
      <Route path="/login">
        {() => <MainLayout><LoginPage /></MainLayout>}
      </Route>
      <Route path="/guest-signup">
        {() => <MainLayout><GuestSignupPage /></MainLayout>}
      </Route>
      <Route path="/profile">
        {() => <MainLayout><ProfilePage /></MainLayout>}
      </Route>
      <Route path="/qiyas-exam">
        {() => <MainLayout><QiyasExamPage /></MainLayout>}
      </Route>
      <Route path="/mock-exam">
        {() => <MainLayout><MockExamPage /></MainLayout>}
      </Route>
      <Route path="/custom-exam">
        {() => <MainLayout><CustomExamPage /></MainLayout>}
      </Route>
      <Route path="/library">
        {() => <MainLayout><LibraryPage /></MainLayout>}
      </Route>
      <Route path="/time-management">
        {() => <MainLayout><TimeManagementPage /></MainLayout>}
      </Route>
      <Route path="/advanced-time-management">
        {() => <MainLayout><AdvancedTimeManagementPage /></MainLayout>}
      </Route>
      <Route path="/new-time-management">
        {() => <MainLayout><NewTimeManagementPage /></MainLayout>}
      </Route>
      <Route path="/challenge">
        {() => <MainLayout><ChallengePage /></MainLayout>}
      </Route>
      <Route path="/mistake-challenge">
        {() => <MainLayout><MistakeChallengePage /></MainLayout>}
      </Route>
      <Route path="/ask-question">
        {() => <MainLayout><AskQuestionPage /></MainLayout>}
      </Route>
      <Route path="/books">
        {() => <MainLayout><BooksPage /></MainLayout>}
      </Route>
      <Route path="/install">
        {() => <MainLayout><InstallPage /></MainLayout>}
      </Route>
      <Route path="/folders">
        {() => <MainLayout><FoldersPage /></MainLayout>}
      </Route>
      <Route path="/exam-records">
        {() => <MainLayout><ExamRecordsPage /></MainLayout>}
      </Route>
      <Route path="/abilities-test">
        {() => <MainLayout><AbilitiesTestPage /></MainLayout>}
      </Route>
      <Route path="/verbal-tests">
        {() => <MainLayout><VerbalTests /></MainLayout>}
      </Route>
      <Route path="/verbal-test-runner">
        {() => <MainLayout><VerbalTestRunner /></MainLayout>}
      </Route>
      <Route path="/quantitative-tests">
        {() => <MainLayout><QuantitativeTests /></MainLayout>}
      </Route>
      <Route path="/quantitative-test-runner">
        {() => <MainLayout><QuantitativeTestRunner /></MainLayout>}
      </Route>
      <Route path="/qualification-exam">
        {() => <MainLayout><QualificationExamPage /></MainLayout>}
      </Route>
      <Route path="/subscription">
        {() => <MainLayout><SubscriptionPage /></MainLayout>}
      </Route>
      <Route path="/test-results">
        {() => <MainLayout><TestResultsPage /></MainLayout>}
      </Route>
      {/* Fallback to 404 */}
      <Route>
        {() => <MainLayout><NotFound /></MainLayout>}
      </Route>
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [splashDone, setSplashDone] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setSplashDone(true);
    }, 3000); // زيادة مدة العرض لمشاهدة الشاشة الإبداعية
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <LoadingScreen message="مرحباً بك في منصة قدراتك - أفضل منصة للتحضير لاختبارات القدرات 🚀" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
        <AppRoutes />
      </div>
    </QueryClientProvider>
  );
}

export default App;