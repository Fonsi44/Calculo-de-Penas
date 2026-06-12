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
    <div className={cn('mb-3.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-text-secondary mb-1.5 block tracking-wide"
        >
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xxs text-text-muted mt-1.5 italic leading-relaxed">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xxs text-danger mt-1.5 font-semibold leading-relaxed">
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">
          {iconLeft}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full h-10 rounded-md border bg-surface text-sm text-text',
          'px-3.5 outline-none transition-all duration-200',
          'placeholder:text-text-muted',
          'hover:border-border-strong',
          'focus:bg-surface focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-alt',
          invalid ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(178,34,52,0.18)]' : 'border-border',
          iconLeft && 'pl-10',
          iconRight && 'pr-10',
          className,
        )}
        {...rest}
      />
      {iconRight && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted z-10">
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
        'w-full rounded-md border bg-surface text-sm text-text',
        'px-3.5 py-2.5 outline-none transition-all duration-200 resize-y min-h-[88px]',
        'placeholder:text-text-muted',
        'hover:border-border-strong',
        'focus:bg-surface focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.18)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-alt',
        invalid ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(178,34,52,0.18)]' : 'border-border',
        className,
      )}
      {...rest}
    />
  );
});
