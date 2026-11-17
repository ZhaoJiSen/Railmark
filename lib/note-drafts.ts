'use client'

import { create } from 'zustand'
import { Desk } from './mygo'

interface NoteDrafts {
  noteDrafts: Record<number, string>
  setNoteDraft: (id: number, text: string) => void
  savingNotes: Set<number>
  saveNote: (id: number, text: string) => Promise<void>
}

export const useNoteDrafts = create<NoteDrafts>((set, get) => ({
  noteDrafts: {},
  setNoteDraft(id, text) {
    set(state => {
      const noteDrafts = { ...state.noteDrafts }
      if (text) noteDrafts[id] = text
      else delete noteDrafts[id]
      return { noteDrafts }
    })
  },
  savingNotes: new Set(),
  async saveNote(id, text) {
    if (!text.trim() || get().savingNotes.has(id)) return
    set(state => ({ savingNotes: new Set(state.savingNotes).add(id) }))
    try {
      await Desk.addNote(id, text)
      if (get().noteDrafts[id] === text) get().setNoteDraft(id, '')
    } finally {
      set(state => {
        const savingNotes = new Set(state.savingNotes)
        savingNotes.delete(id)
        return { savingNotes }
      })
    }
  },
}))
