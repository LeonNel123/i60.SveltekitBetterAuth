import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isOneOf<T extends readonly string[]>(
	value: string,
	allowed: T
): value is T[number] {
	return allowed.includes(value as T[number]);
}

// Types required by shadcn-svelte components
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
	ref?: E | null;
};

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;
export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChild<T> = Omit<T, 'child'>;
