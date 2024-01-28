import type { NoteProps } from '$types/Note';
import type { Writable, Updater, Subscriber, Unsubscriber, Invalidator } from 'svelte/store';
import { writable } from 'svelte/store';

/* class NoteStore implements Writable<NoteProps[]> {
	set!: (this: void, value: never[]) => void;
	update!: (this: void, updater: Updater<never[]>) => void;
	subscribe!: (
		this: void,
		run: Subscriber<never[]>,
		invalidate?: Invalidator<never[]> | undefined
	) => Unsubscriber;

	contructor() {
		const { set, update, subscribe } = writable<NoteProps[]>(this);
		this.set = set;
		this.update = update;
		this.subscribe = subscribe;
	}

	updateNote(note: NoteProps) {
		this.update((storeData: NoteProps[]) => {
			const idx = storeData.findIndex((item: NoteProps) => item.id === note.id);
			if (idx !== -1) {
				storeData[idx] = note;
				return storeData;
			}

			return [...storeData, note];
		});
	}

	deleteNote(noteId: string) {
		this.update((storeData: NoteProps[]) => {
			const idx = storeData.findIndex((item: NoteProps) => item.id === noteId);
			if (idx === -1) {
				return storeData;
			}

			storeData.splice(idx, 1);
			return storeData;
		});
	}
}

export default NoteStore; */
const { subscribe, set, update } = writable<NoteProps[]>([]);
export default {
	subscribe,
	set,
	update,
	updateNote(note: NoteProps) {
		this.update((storeData: NoteProps[]) => {
			const idx = storeData.findIndex((item: NoteProps) => item.id === note.id);
			if (idx !== -1) {
				storeData[idx] = note;
				return storeData;
			}

			return [...storeData, note];
		});
	},
	deleteNote(noteId: string) {
		this.update((storeData: NoteProps[]) => {
			const idx = storeData.findIndex((item: NoteProps) => item.id === noteId);
			if (idx === -1) {
				return storeData;
			}

			storeData.splice(idx, 1);
			return storeData;
		});
	}
};
