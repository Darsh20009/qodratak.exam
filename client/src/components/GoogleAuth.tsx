
import React from 'react';
import { Button } from "@/components/ui/button";
import { FcGoogle } from 'react-icons/fc';

export function GoogleAuth() {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <Button 
      onClick={handleGoogleLogin}
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <FcGoogle className="w-5 h-5" />
      <span>تسجيل الدخول بحساب جوجل</span>
    </Button>
  );
}
