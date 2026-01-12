"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UIMessage } from "ai";
import { SavedChat, chatHistoryManager } from "@/lib/chat-history";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { supabaseChatHistoryManager } from "@/lib/chat-history-supabase";

export interface UseChatHistoryReturn {
  // State
  chats: SavedChat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  saveCurrentChat: (
    messages: UIMessage[],
    model: string,
    title?: string
  ) => Promise<SavedChat | null>;
  loadChat: (chatId: string) => SavedChat | null;
  deleteChat: (chatId: string) => Promise<boolean>;
  clearAllChats: () => Promise<boolean>;
  setCurrentChatId: (chatId: string | null) => void;

  // Auto-save functionality
  enableAutoSave: (messages: UIMessage[], model: string) => void;
  disableAutoSave: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination state (for Supabase mode)
  const [pageFrom, setPageFrom] = useState<number>(0);
  const [pageSize] = useState<number>(supabaseChatHistoryManager.DEFAULT_PAGE_SIZE || 50);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSaveRef = useRef<{
    messages: UIMessage[];
    model: string;
  } | null>(null);

  // Load chats from Supabase or localStorage on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (isSupabaseConfigured()) {
          const loadedChats = await supabaseChatHistoryManager.getChatsPage(pageSize, 0);
          setChats(loadedChats);
          setPageFrom(loadedChats.length);
          setHasMore(loadedChats.length === pageSize);
        } else {
          const loadedChats = chatHistoryManager.getAllChats();
          setChats(loadedChats);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        setError("Failed to load chat history");
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, []);

  // Listen for append events dispatched by the sidebar 'Load more' control
  useEffect(() => {
    const onAppend = (e: Event) => {
      try {
        const custom = e as CustomEvent<{ chats: SavedChat[] }>;
        const newChats = custom.detail?.chats || [];
        if (newChats.length > 0) {
          setChats((prev) => {
            // Avoid duplicates by id
            const existingIds = new Set(prev.map((c) => c.id));
            const filtered = newChats.filter((c) => !existingIds.has(c.id));
            return [...prev, ...filtered];
          });
          setPageFrom((p) => p + newChats.length);
          setHasMore(newChats.length === pageSize);
        }
      } catch (err) {
        console.error("Failed to append chats from event:", err);
      }
    };

    window.addEventListener("supabase:appendChats", onAppend as EventListener);
    return () => window.removeEventListener("supabase:appendChats", onAppend as EventListener);
  }, [pageSize]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save current chat
  const saveCurrentChat = useCallback(
    async (messages: UIMessage[], model: string): Promise<SavedChat | null> => {
      try {
        setError(null);

        // Don't save empty chats
        if (!messages || messages.length === 0) {
          return null;
        }

        let savedChat: SavedChat | null = null;

        if (isSupabaseConfigured()) {
          // Supabase-backed save/update
          if (currentChatId) {
            const ok = await supabaseChatHistoryManager.updateChat(currentChatId, {
              messages,
              model,
            });

            if (ok) {
              savedChat = await supabaseChatHistoryManager.getChatById(currentChatId);
            }
          } else {
            const created = await supabaseChatHistoryManager.saveChat({ messages, model });
            if (created) {
              savedChat = created;
              setCurrentChatId(savedChat.id);
            }
          }

          if (savedChat) {
            const updatedChats = await supabaseChatHistoryManager.getAllChats();
            setChats(updatedChats);
            return savedChat;
          } else {
            setError("Failed to save chat");
            return null;
          }
        } else {
          // LocalStorage fallback (existing behavior)
          if (currentChatId) {
            const success = chatHistoryManager.updateChat(currentChatId, {
              messages,
              model,
            });

            if (success) {
              savedChat = chatHistoryManager.getChatById(currentChatId);
            }
          } else {
            savedChat = chatHistoryManager.saveChat({ messages, model });
            if (savedChat) setCurrentChatId(savedChat.id);
          }

          if (savedChat) {
            const updatedChats = chatHistoryManager.getAllChats();
            setChats(updatedChats);
            return savedChat;
          } else {
            setError("Failed to save chat");
            return null;
          }
        }
      } catch (err: any) {
        // Log full error and surface the message to the UI when available for easier debugging.
        console.error("Failed to save chat:", err);
        const msg = err?.message || err?.toString() || "Failed to save chat";
        setError(msg);
        return null;
      }
    },
    [currentChatId]
  );

  // Load a specific chat (synchronous from state)
  const loadChat = useCallback(
    (chatId: string): SavedChat | null => {
      try {
        setError(null);
        const chat = chats.find((c) => c.id === chatId) || null;

        if (chat) {
          setCurrentChatId(chatId);
          return chat;
        } else {
          setError("Chat not found");
          return null;
        }
      } catch (err) {
        console.error("Failed to load chat:", err);
        setError("Failed to load chat");
        return null;
      }
    },
    [chats]
  );

  // Delete a chat
  const deleteChat = useCallback(
    async (chatId: string): Promise<boolean> => {
      try {
        setError(null);

        let success: boolean;
        if (isSupabaseConfigured()) {
          success = await supabaseChatHistoryManager.deleteChat(chatId);
        } else {
          success = chatHistoryManager.deleteChat(chatId);
        }

        if (success) {
          if (currentChatId === chatId) setCurrentChatId(null);
          const updatedChats = isSupabaseConfigured()
            ? await supabaseChatHistoryManager.getAllChats()
            : chatHistoryManager.getAllChats();
          setChats(updatedChats);
          return true;
        } else {
          setError("Failed to delete chat");
          return false;
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
        setError("Failed to delete chat");
        return false;
      }
    },
    [currentChatId]
  );

  // Clear all chats
  const clearAllChats = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      let success: boolean;
      if (isSupabaseConfigured()) {
        success = await supabaseChatHistoryManager.clearAllChats();
      } else {
        success = chatHistoryManager.clearAllChats();
      }

      if (success) {
        setChats([]);
        setCurrentChatId(null);
        return true;
      } else {
        setError("Failed to clear chat history");
        return false;
      }
    } catch (err) {
      console.error("Failed to clear chat history:", err);
      setError("Failed to clear chat history");
      return false;
    }
  }, []);

  // Auto-save functionality
  const enableAutoSave = useCallback(
    (messages: UIMessage[], model: string) => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Check if we need to save (messages have changed)
      const lastSave = lastAutoSaveRef.current;
      const hasChanged =
        !lastSave ||
        lastSave.messages.length !== messages.length ||
        lastSave.model !== model ||
        JSON.stringify(lastSave.messages) !== JSON.stringify(messages);

      if (hasChanged && messages.length > 0) {
        // Debounce auto-save by 2 seconds
        autoSaveTimeoutRef.current = setTimeout(() => {
          // fire and forget
          void saveCurrentChat(messages, model);
          lastAutoSaveRef.current = { messages: [...messages], model };
        }, 2000);
      }
    },
    [saveCurrentChat]
  );

  const disableAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    lastAutoSaveRef.current = null;
  }, []);

  return {
    // State
    chats,
    currentChatId,
    isLoading,
    error,

    // Actions
    saveCurrentChat,
    loadChat,
    deleteChat,
    clearAllChats,
    setCurrentChatId,

    // Auto-save
    enableAutoSave,
    disableAutoSave,
  };
}
