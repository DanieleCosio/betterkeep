import { writable } from 'svelte/store';

export const globals = writable({ MAX_ITERATIONS: 100000 });
