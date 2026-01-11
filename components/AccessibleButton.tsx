import React from 'react';

interface AccessibleButtonProps {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({ 
  label, 
  onClick, 
  ariaLabel,
  variant = 'primary',
  className = ''
}) => {
  // Added active:scale-95 for the "shrinking" effect and transition classes
  const baseStyles = "w-full py-6 px-8 rounded-xl text-2xl md:text-3xl font-bold shadow-lg transition-all duration-150 transform active:scale-95 border-4 focus:outline-none focus:ring-4 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-700 text-white border-transparent hover:bg-blue-800 active:bg-blue-900 focus:ring-yellow-400 focus:border-yellow-400",
    secondary: "bg-white text-blue-800 border-blue-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-blue-500",
    danger: "bg-red-600 text-white border-transparent hover:bg-red-700 active:bg-red-800 focus:ring-red-400"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={ariaLabel || label}
    >
      {label}
    </button>
  );
};