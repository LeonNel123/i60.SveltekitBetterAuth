export function getSafeRedirectPath(candidate: string | null | undefined, fallback = '/dashboard') {
	if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) {
		return fallback;
	}

	// Reject anything a browser might interpret as an absolute URL
	try {
		const parsed = new URL(candidate, 'http://localhost');
		if (parsed.origin !== 'http://localhost') return fallback;
	} catch {
		return fallback;
	}

	return candidate;
}
