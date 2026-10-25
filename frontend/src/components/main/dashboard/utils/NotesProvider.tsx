import React, { createContext, useContext, useEffect, useState } from "react";

export interface NoteData {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
}

interface NotesContextType {
    notes: NoteData[];
    activeNoteId: string | null;
    activeNote: NoteData | undefined;
    createNote: () => void;
    switchNote: (id: string) => void;
    updateNote: (id: string, updates: Partial<NoteData>) => void;
    deleteNote: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = "dashboard_notes_v1";

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const [notes, setNotes] = useState<NoteData[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("idk ", e);
            }
        }
        return [];
    });

    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }, [notes]);

    const activeNote = notes.find((n) => n.id === activeNoteId);

    const createNote = () => {
        const newNote: NoteData = {
            id: `note-${Date.now()}`,
            title: "Untitled Note",
            content: "",
            updatedAt: Date.now(),
        };
        setNotes((prev) => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
    };

    const switchNote = (id: string) => setActiveNoteId(id);

    const updateNote = (id: string, updates: Partial<NoteData>) => {
        setNotes((prev) =>
            prev.map((note) =>
                note.id === id
                    ? { ...note, ...updates, updatedAt: Date.now() }
                    : note,
            ),
        );
    };

    const deleteNote = (id: string) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (activeNoteId === id) setActiveNoteId(null);
    };

    return (
        <NotesContext.Provider
            value={{
                notes,
                activeNoteId,
                activeNote,
                createNote,
                switchNote,
                updateNote,
                deleteNote,
            }}
        >
            {children}
        </NotesContext.Provider>
    );
}

export function useNotes() {
    const context = useContext(NotesContext);
    if (context === undefined) {
        throw new Error("useNotes must be used within a NotesProvider");
    }
    return context;
}
