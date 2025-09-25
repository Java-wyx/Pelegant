
import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { motion } from "framer-motion";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({
  className,
  value,
  onChange,
  onClear,
  ...props
}: SearchInputProps) {
  // Only show the clear button if there is a value and onClear is provided
  const showClearButton = value && onClear;
  
  return (
    <div className={cn("flex items-center px-4 py-3 rounded-xl", className)}>
      <Search size={20} className="text-ios-primary mr-3" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
        {...props}
      />
      {showClearButton && (
        <button
          onClick={onClear}
          className="ml-2 p-1.5 rounded-full bg-ios-muted hover:bg-ios-subtle"
          type="button" /* Explicitly set button type to prevent form submission */
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
