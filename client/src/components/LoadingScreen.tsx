const newLogoPath = "/qodratak-logo.png";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "رحلتك نحو التميز والإبداع" }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0a1628] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full" />
        <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-green-100/20 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-teal-100/15 rounded-full blur-[90px] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-amber-100/10 rounded-full blur-[90px] animate-pulse-slow delay-1000" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 w-40 h-40 bg-primary/30 rounded-full blur-2xl animate-glow" />
          <img 
            src={newLogoPath} 
            alt="شعار قدراتك" 
            className="relative w-40 h-40 object-contain drop-shadow-2xl animate-float"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-primary-foreground to-primary/90 bg-clip-text text-transparent mb-3">
          منصة قدراتك
        </h1>
        
        <p className="text-gray-400 text-lg mb-8">
          {message}
        </p>

        <div className="w-64 relative">
          <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700/30">
            <div className="h-full bg-gradient-to-r from-primary via-green-600 to-primary rounded-full animate-loading-bar shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-out forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
}
