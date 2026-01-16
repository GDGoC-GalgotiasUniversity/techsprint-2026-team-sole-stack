"use client";

import { memo, useState } from "react";
import { SavedChat } from "@/lib/chat-history";
import { UIMessage } from "ai";
import { getModelByValue } from "@/lib/model";

// Generate display title from messages
function getDisplayTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find(
    (msg) =>
      msg.role === "user" && msg.parts?.some((part) => part.type === "text")
  );

  if (!firstUserMessage) {
    return "New Chat";
  }

  const textParts =
    firstUserMessage.parts?.filter((part) => part.type === "text") || [];
  const fullText = textParts
    .map((part) => part.text)
    .join(" ")
    .trim();

  if (!fullText) {
    return "New Chat";
  }

  // Use first 5 words for title
  const words = fullText.split(/\s+/).filter((word) => word.length > 0);
  const titleWords = words.slice(0, 5);
  const title = titleWords.join(" ");

  // Add ellipsis if there are more words
  return words.length > 5 ? `${title}...` : title;
}

interface ChatHistoryItemProps {
  chat: SavedChat;
  isActive?: boolean;
  onContinue: (chat: SavedChat) => void;
  onDelete: (chatId: string) => void;
}

export const ChatHistoryItem = memo(function ChatHistoryItem({
  chat,
  isActive = false,
  onContinue,
  onDelete,
}: ChatHistoryItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const model = getModelByValue(chat.model);
  const modelLabel = model?.label || chat.model;
  const displayTitle = getDisplayTitle(chat.messages);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Recently";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(chat.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`group relative p-3 rounded-lg border transition-all duration-200 ${isActive
          ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          : "bg-transparent border-transparent hover:bg-zinc-800/50 hover:border-zinc-700"
        }`}
    >
      {/* Chat Title */}
      <div className="mb-2">
        <h3
          className={`text-sm font-medium line-clamp-2 transition-colors ${isActive
              ? "text-cyan-100"
              : "text-zinc-300 group-hover:text-zinc-100"
            }`}
          title={displayTitle}
        >
          {displayTitle}
        </h3>
      </div>

      {/* Model Badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-400'
          }`}>
          {modelLabel}
        </span>
      </div>

      {/* Timestamp and Message Count */}
      <div className="flex items-center justify-between text-zinc-600 group-hover:text-zinc-500 mb-3 text-xs">
        <span>{formatDate(chat.updatedAt)}</span>
        <span>{chat.messages.length} msgs</span>
      </div>

      {/* Action Buttons */}
      {showDeleteConfirm ? (
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded transition-colors shadow-red-900/40 shadow-sm"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={handleCancelDelete}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onContinue(chat)}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 hover:bg-cyan-900/50 hover:border-cyan-700 rounded transition-colors"
          >
            Open
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-2 py-1.5 text-xs text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-900/40 hover:border-red-800 rounded transition-colors"
            title="Delete chat"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});
