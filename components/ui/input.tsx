import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/ui';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('mb-3', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-text-secondary mb-1.5 block"
        >
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xxs text-text-muted mt-1 italic">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xxs text-danger mt-1 font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, iconLeft, iconRight, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {iconLeft && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          {iconLeft}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full h-10 rounded-md border bg-surface-alt text-sm text-text',
          'px-3 outline-none transition-colors',
          'focus:border-accent focus:bg-surface',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          invalid ? 'border-danger' : 'border-border',
          iconLeft && 'pl-9',
          iconRight && 'pr-9',
          className,
        )}
        {...rest}
      />
      {iconRight && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
          {iconRight}
        </span>
      )}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full rounded-md border bg-surface-alt text-sm text-text',
        'px-3 py-2 outline-none transition-colors resize-y min-h-[60px]',
        'focus:border-accent focus:bg-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      {...rest}
    />
  );
});
