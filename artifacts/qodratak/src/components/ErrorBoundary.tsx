import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary caught] ${error.name}: ${error.message}`);
      for (const frame of error.stack?.split("\n").slice(1) || []) {
        console.error(`[ErrorBoundary JS stack] ${frame.trim()}`);
      }
      if (info.componentStack) {
        console.error("[ErrorBoundary] React component stack:");
        for (const frame of info.componentStack.split("\n")) {
          if (frame.trim()) console.error(`[ErrorBoundary component] ${frame.trim()}`);
        }
      }
      return;
    }

    console.error(`ErrorBoundary caught: ${error.name}: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error)
          : this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-red-800/40 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold">حدث خطأ غير متوقع</h2>
            <p className="text-slate-400 text-sm">{this.state.error?.message || "خطأ في تحميل الصفحة"}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
