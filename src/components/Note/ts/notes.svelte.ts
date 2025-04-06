import type { Index } from "$types/Index";
import type { NoteProps } from "$types/Note";

export function getNotesIndex(notes: NoteProps[]): Index {
    const notesIndex: Index = {};

    for (let i = 0; i < notes.length; i++) {
        notesIndex[notes[i].id] = i;
    }

    return notesIndex;
}