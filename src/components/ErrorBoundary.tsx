"use client";

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    // Convert error to string to avoid rendering object errors
    let errorMessage = 'Unknown error';
    try {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      errorMessage = 'Error occurred (could not stringify)';
    }
    console.error('ErrorBoundary caught error:', errorMessage);
    console.error('ErrorBoundary error type:', typeof error);
    console.error('ErrorBoundary error keys:', error && typeof error === 'object' ? Object.keys(error) : 'N/A');
    return { hasError: true, error: new Error(errorMessage) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details - convert to strings to avoid object rendering issues
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace';
    
    console.error('ErrorBoundary - Error Message:', errorMessage);
    console.error('ErrorBoundary - Error Stack:', errorStack);
    console.error('ErrorBoundary - Component Stack:', errorInfo.componentStack);
    
    // Log the raw error object only if it has properties
    if (error && typeof error === 'object' && Object.keys(error).length > 0) {
      console.error('ErrorBoundary - Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

