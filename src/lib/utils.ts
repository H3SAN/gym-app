import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function daysUntil(date: Date | string) {
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getMembershipColor(tier: string) {
  switch (tier) {
    case 'ELITE':
      return 'from-yellow-500 to-orange-500'
    case 'PRO':
      return 'from-green-600 to-emerald-700'
    default:
      return 'from-gray-600 to-gray-700'
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'ADVANCED':
      return 'text-red-500 bg-red-50'
    case 'INTERMEDIATE':
      return 'text-yellow-600 bg-yellow-50'
    default:
      return 'text-green-600 bg-green-50'
  }
}
