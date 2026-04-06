export function buildRelativeUrl(
	pathname: string,
	search: string,
	updates: Record<string, string | null | undefined>
): string {
	const params = new URLSearchParams(search);

	for (const [key, value] of Object.entries(updates)) {
		if (!value) {
			params.delete(key);
			continue;
		}

		params.set(key, value);
	}

	const query = params.toString();
	return query ? `${pathname}?${query}` : pathname;
}
