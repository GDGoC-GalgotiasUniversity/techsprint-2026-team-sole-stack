"use client";

import { memo, useState, useEffect, useRef } from "react";
import { MAX_CHATS, SavedChat, chatHistoryManager } from "@/lib/chat-history";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { supabaseChatHistoryManager } from "@/lib/chat-history-supabase";
import { ChatHistoryItem } from "./ChatHistoryItem";

interface ChatHistorySidebarProps {
  chats: SavedChat[];
  currentChatId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onContinueChat: (chat: SavedChat) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: () => void;
}

export const ChatHistorySidebar = memo(function ChatHistorySidebar({
  chats,
  currentChatId,
  isOpen,
  onToggle,
  onContinueChat,
  onDeleteChat,
  onNewChat,
}: ChatHistorySidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [localChatsCount, setLocalChatsCount] = useState<number>(0);
  // Pagination state (used when Supabase is configured)
  const [pageFrom, setPageFrom] = useState<number>(0);
  const [pageSize] = useState<number>(supabaseChatHistoryManager.DEFAULT_PAGE_SIZE || 50);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // check if there are local chats for migration UI
    try {
      const local = chatHistoryManager.getAllChats();
      setLocalChatsCount(local.length);
    } catch (e) {
      setLocalChatsCount(0);
    }

    // If Supabase is configured, load the first page of chats instead of all
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const firstPage = await supabaseChatHistoryManager.getChatsPage(pageSize, 0);
          setHasMore(firstPage.length === pageSize);
          setPageFrom(firstPage.length);
          // dispatch the first page so the hook can append/populate if needed
          if (firstPage.length > 0) {
            const ev = new CustomEvent("supabase:appendChats", { detail: { chats: firstPage } });
            window.dispatchEvent(ev);
          }
        } catch (err) {
          console.error("Failed to load first page of chats for sidebar:", err);
        }
      })();
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close sidebar with Escape key
      if (event.key === "Escape" && isOpen) {
        onToggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  // Infinite scroll: fetch next page when user scrolls near bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el || !isSupabaseConfigured()) return;

    const threshold = 200; // px from bottom to trigger

    const onScroll = async () => {
      if (!hasMore || loadingMore) return;
      try {
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollHeight - scrollTop - clientHeight <= threshold) {
          setLoadingMore(true);
          try {
            const nextPage = await supabaseChatHistoryManager.getChatsPage(pageSize, pageFrom);
            if (nextPage.length > 0) {
              const ev = new CustomEvent("supabase:appendChats", { detail: { chats: nextPage } });
              window.dispatchEvent(ev);
            }
            setPageFrom((p) => p + nextPage.length);
            setHasMore(nextPage.length === pageSize);
          } catch (err) {
            console.error("Failed to load next page on scroll:", err);
          } finally {
            setLoadingMore(false);
          }
        }
      } catch (err) {
        console.error("Error in scroll handler:", err);
      }
    };

  el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
    };
    // Intentionally include the state vars we read/write
  }, [pageFrom, pageSize, hasMore, loadingMore]);

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-full bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-l-lg shadow-lg transition-all duration-200 z-10 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            isOpen ? "-scale-90 rounded-full" : ""
          }`}
          title={isOpen ? "Close chat history" : "Open chat history"}
          aria-label={isOpen ? "Close chat history" : "Open chat history"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Sidebar Content */}
        <div className="w-80 sm:w-96 h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Chat History
              </h2>
              <button
                type="button"
                onClick={onNewChat}
                className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                title="Start new chat"
                aria-label="Start new chat"
              >
                New Chat
              </button>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {chats.length} conversations
            </p>
          </div>

          {/* Chat List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  No chat history yet
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Start a conversation to see your chat history here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chats.map((chat) => (
                  <ChatHistoryItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    onContinue={onContinueChat}
                    onDelete={onDeleteChat}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                {isSupabaseConfigured() ? (
                  <>
                    <p>Chats are saved remotely in Supabase</p>
                    <p className="mt-1">All conversations are persisted to your project</p>
                    {/* Dev-only migration page removed; local migration handled externally if needed */}
                    {hasMore && (
                      <div className="mt-2">
                        {/* Loader indicator for infinite scroll */}
                        {loadingMore ? (
                          <div className="text-sm text-neutral-600">Loading more...</div>
                        ) : (
                          <div className="text-sm text-neutral-500">Scroll to load more</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p>Chats are saved locally in your browser</p>
                    <p className="mt-1">Only the {MAX_CHATS} most recent chats are kept</p>
                  </>
                )}
              </div>
          </div>
        </div>
      </div>
    </>
  );
});

