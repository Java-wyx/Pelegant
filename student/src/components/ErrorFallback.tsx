import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button 
          onClick={resetErrorBoundary}
          className="bg-ios-primary hover:bg-ios-primary/90"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
