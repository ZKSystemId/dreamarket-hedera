import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'Common':
      return 'from-gray-400 to-gray-600';
    case 'Rare':
      return 'from-blue-400 to-blue-600';
    case 'Legendary':
      return 'from-purple-400 to-purple-600';
    case 'Mythic':
      return 'from-amber-400 via-orange-500 to-red-600';
    default:
      return 'from-gray-400 to-gray-600';
  }
}

export function getRarityBorderColor(rarity: string): string {
  switch (rarity) {
    case 'Common':
      return 'border-gray-500';
    case 'Rare':
      return 'border-blue-500';
    case 'Legendary':
      return 'border-purple-500';
    case 'Mythic':
      return 'border-orange-500';
    default:
      return 'border-gray-500';
  }
}

export function getAvatarGradient(seed: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-amber-500 to-orange-500',
  ];
  
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
