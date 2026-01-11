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
  const baseStyles = "w-full py-5 px-8 rounded-lg text-xl md:text-2xl font-brand font-bold shadow-md transition-all duration-200 transform active:scale-95 border-2 focus:outline-none focus:ring-4 focus:ring-offset-2";
  
  const variants = {
    // Primary usa o Azul da marca com texto branco. Hover escurece levemente. Focus ring usa o Amarelo da marca para alto contraste.
    primary: "bg-brand-blue text-white border-transparent hover:brightness-110 active:brightness-90 focus:ring-brand-yellow focus:border-transparent",
    
    // Secondary usa fundo branco com borda Azul da marca e texto Azul.
    secondary: "bg-white text-brand-blue border-brand-blue hover:bg-blue-50 active:bg-blue-100 focus:ring-brand-blue",
    
    // Danger usa o Vermelho da marca.
    danger: "bg-brand-red text-white border-transparent hover:bg-red-600 active:bg-red-700 focus:ring-red-400"
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