"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
          <div className="card w-full max-w-md p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
              <AlertTriangle size={30} />
            </div>
            <h1 className="mb-2 text-2xl font-extrabold text-ink">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm text-ink-mute">
              {this.state.error?.message ||
                "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={this.handleReset} className="btn btn-brand btn-block">
                <RefreshCw size={16} />
                Try again
              </button>
              <Link href="/" className="btn btn-outline btn-block">
                <Home size={16} />
                Go to home
              </Link>
            </div>
            <p className="mt-6 text-xs text-ink-faint">
              If this problem persists, please contact support.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}