
import { create } from 'zustand';
// import { Receiver } from '../types';
import { Receiver } from "../types/index"
interface SelectionStore {
  selectedContacts: Receiver[];
  setSelectedContacts: (contacts: Receiver[]) => void;
  clearSelection: () => void;
}

export const useSelection = create<SelectionStore>((set) => ({
  selectedContacts: [],
  setSelectedContacts: (contacts) => set({ selectedContacts: contacts }),
  clearSelection: () => set({ selectedContacts: [] }),
}));