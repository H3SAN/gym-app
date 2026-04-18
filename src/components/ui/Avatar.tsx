import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  name?: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({ name = '', src, size = 'md', className }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }

  const pixelSizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 }

  if (src) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden bg-gray-200 flex-shrink-0',
          sizes[size],
          className
        )}
      >
        <Image
          src={src}
          alt={name}
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-green-100 text-green-700 font-semibold flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
