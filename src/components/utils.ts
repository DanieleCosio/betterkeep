export function getRandomString(length = 8): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
	const charLength: number = chars.length;
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * charLength));
	}
	return result;
}

/* export function debounce(
	callback: () => void,
	timer: NodeJS.Timeout | undefined,
	delay = 250
): NodeJS.Timeout {
	if (timer) {
		clearTimeout(timer);
	}

	return setTimeout(callback, delay);
}
 */