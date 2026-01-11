/**
 * INPUT COMPONENT
 * ===============
 * Unified input component for all Geniefy products.
 */

import * as React from "react";
import { cn, inputVariants, type InputVariants } from "@/theme";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    InputVariants {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: error ? "error" : variant, inputSize }),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
