import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 border-t border-slate-200 dark:border-gray-700 py-6 mt-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            جميع الحقوق محفوظة لمنصة قدراتك © {new Date().getFullYear()}
          </div>
          
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700 mt-3"></div>
        </div>
      </div>
    </footer>
  );
}