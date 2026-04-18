'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

    const variants = {
      primary:
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500',
      secondary:
        'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300 focus:ring-green-400',
      outline:
        'border-2 border-green-600 text-green-600 hover:bg-green-50 active:bg-green-100 focus:ring-green-500',
      ghost:
        'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-400',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 12 : 16} />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
