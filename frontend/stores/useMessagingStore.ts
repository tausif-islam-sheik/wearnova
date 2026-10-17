import { create } from "zustand";
import type { Conversation, Message } from "@/types";

interface MessagingState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  startConversation: (listingId: string, participantIds: string[]) => Conversation;
  sendMessage: (conversationId: string, senderId: string, text: string) => void;
  markAsRead: (conversationId: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
}

export const useMessagingStore = create<MessagingState>()((set, get) => ({
  conversations: [],
  messages: {},

  startConversation: (listingId, participantIds) => {
    const existing = get().conversations.find(
      (c) =>
        c.listingId === listingId &&
        participantIds.every((p) => c.participantIds.includes(p))
    );
    if (existing) return existing;

    const id = `conv-${Date.now()}`;
    const conversation: Conversation = {
      id,
      listingId,
      participantIds,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      messages: { ...state.messages, [id]: [] },
    }));
    return conversation;
  },

  sendMessage: (conversationId, senderId, text) => {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), msg],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
          : c
      ),
    }));
  },

  markAsRead: (conversationId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) => ({
          ...m,
          read: true,
        })),
      },
    })),

  getConversation: (id) => get().conversations.find((c) => c.id === id),
  getMessages: (conversationId) => get().messages[conversationId] ?? [],
}));
