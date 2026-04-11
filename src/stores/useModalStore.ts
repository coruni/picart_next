import { create } from "zustand";

interface ModalData {
  avatarFrameId?: number;
}

interface ModalState {
  modals: Record<string, boolean>;
  modalData: Record<string, ModalData>;
  openModal: (id: string, data?: ModalData) => void;
  closeModal: (id: string) => void;
  toggleModal: (id: string) => void;
  isOpen: (id: string) => boolean;
  getModalData: (id: string) => ModalData | undefined;
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: {},
  modalData: {},

  openModal: (id, data) =>
    set((state) => ({
      modals: { ...state.modals, [id]: true },
      modalData: data ? { ...state.modalData, [id]: data } : state.modalData,
    })),

  closeModal: (id) =>
    set((state) => ({
      modals: { ...state.modals, [id]: false },
      modalData: { ...state.modalData, [id]: undefined },
    })),

  toggleModal: (id) =>
    set((state) => ({
      modals: { ...state.modals, [id]: !state.modals[id] },
    })),

  isOpen: (id) => {
    const { modals } = get();
    return modals[id] || false;
  },

  getModalData: (id) => {
    const { modalData } = get();
    return modalData[id];
  },
}));
