import React from "react";

const LoadingSpinner = ({ fullPage = false }) => {
  const spinnerElement = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Outer Indigo Spin Circle */}
      <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500"></div>
      
      {/* Loading Text */}
      <span className="text-sm font-medium tracking-wide text-indigo-400 animate-pulse">
        ProvenStack Loading...
      </span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f0f] backdrop-blur-sm transition-opacity duration-300">
        {spinnerElement}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-8">
      {spinnerElement}
    </div>
  );
};

export default LoadingSpinner;
