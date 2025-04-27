import React from "react";
import Chatbot from "@/components/Chatbot";

const Home: React.FC = () => {
  return (
    <main className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center p-6 max-w-md">
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400 mb-4">
          ذكائي - مساعدك الشخصي
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
          مساعدك الذكي للإجابة على أسئلتك واختبار قدراتك اللفظية والكمية
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          انقر على زر المحادثة في الأسفل للبدء
        </div>
        <div className="mt-8 flex justify-center">
          <div className="animate-bounce">
            <i className="fas fa-arrow-down text-primary dark:text-blue-400 text-2xl"></i>
          </div>
        </div>
      </div>
      <Chatbot />
    </main>
  );
};

export default Home;
