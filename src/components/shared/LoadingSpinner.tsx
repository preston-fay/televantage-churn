import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = 'Loading...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
      <div className="spinner mb-4"></div>
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
