"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { UIMessage } from "ai";
import { models, type Model } from "@/lib/model";
import { ChatSession } from "./ChatSession";
import { ChatHistorySidebar } from "./ChatHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { SavedChat } from "@/lib/chat-history";
import { useNotifications } from "./Notification";

const ChatContainer = memo(({ userIp }: { userIp: string }) => {
  const [selectedModel, setSelectedModel] = useState<Model["value"]>(
    models[0].value
  );
  const [input, setInput] = useState("");
  const [currentMessages, setCurrentMessages] = useState<UIMessage[]>([]);
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notifications
  const { addNotification, NotificationContainer } = useNotifications();

  // Chat history hook
  const {
    chats,
    currentChatId,
    saveCurrentChat,
    loadChat,
    deleteChat,
    setCurrentChatId,
    enableAutoSave,
    disableAutoSave,
    error,
  } = useChatHistory();

  const handleModelChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      // Save current chat before changing model
      if (currentMessages.length > 0) {
        saveCurrentChat(currentMessages, selectedModel);
      }
      setSelectedModel(event.target.value);
      setCurrentChatId(null); // Reset to new chat
      setChatSessionKey((prev) => prev + 1); // Force re-render
    },
    [currentMessages, selectedModel, saveCurrentChat, setCurrentChatId]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  // Handle messages change from ChatSession
  const handleMessagesChange = useCallback(
    (messages: UIMessage[]) => {
      setCurrentMessages(messages);
      // Enable auto-save for current chat
      enableAutoSave(messages, selectedModel);
    },
    [enableAutoSave, selectedModel]
  );

  // Chat history handlers

  const handleContinueChat = useCallback(
    (chat: SavedChat) => {
      try {
        // Save current chat if it has messages
        if (currentMessages.length > 0 && !currentChatId) {
          saveCurrentChat(currentMessages, selectedModel);
        }

        // Load the selected chat for continuation
        const loadedChat = loadChat(chat.id);
        if (loadedChat) {
          setSelectedModel(loadedChat.model);
          setCurrentMessages(loadedChat.messages);
          setChatSessionKey((prev) => prev + 1); // Force re-render with new messages
          addNotification("Continuing chat", "success", 3000);
        } else {
          addNotification("Failed to continue chat", "error");
        }
      } catch (err) {
        console.error("Error continuing chat:", err);
        addNotification("Failed to continue chat", "error");
      }
    },
    [
      currentMessages,
      currentChatId,
      selectedModel,
      saveCurrentChat,
      loadChat,
      addNotification,
    ]
  );

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        const success = await deleteChat(chatId);
        if (success) {
          addNotification("Chat deleted successfully", "success", 3000);
        } else {
          addNotification("Failed to delete chat", "error");
        }
      } catch (err) {
        console.error("Error deleting chat:", err);
        addNotification("Failed to delete chat", "error");
      }
    },
    [deleteChat, addNotification]
  );

  const handleNewChat = useCallback(() => {
    try {
      // Save current chat if it has messages
      if (currentMessages.length > 0) {
        saveCurrentChat(currentMessages, selectedModel);
        addNotification("Previous chat saved", "info", 3000);
      }

      // Reset to new chat
      setCurrentChatId(null);
      setCurrentMessages([]);
      setInput("");
      disableAutoSave();
      setChatSessionKey((prev) => prev + 1); // Force re-render
      addNotification("Started new chat", "success", 3000);
    } catch (err) {
      console.error("Error starting new chat:", err);
      addNotification("Failed to start new chat", "error");
    }
  }, [
    currentMessages,
    selectedModel,
    saveCurrentChat,
    setCurrentChatId,
    disableAutoSave,
    addNotification,
  ]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Show error notifications from chat history hook
  useEffect(() => {
    if (error) {
      addNotification(error, "error");
    }
  }, [error]); // Remove addNotification from dependencies to prevent re-renders

  return (
    <>
      <div className="flex pb-0.5 h-svh w-full flex-col max-w-5xl mx-auto">
        {/* Chat Session */}
        <ChatSession
          key={`${selectedModel}-${chatSessionKey}`}
          model={selectedModel}
          userIp={userIp}
          input={input}
          setInputAction={(v: string) => setInput(v)}
          initialMessages={currentMessages}
          onMessagesChange={handleMessagesChange}
          modelControls={
            <div className="flex w-full gap-x-3 overflow-x-auto whitespace-nowrap text-xs sm:text-sm scrollbar-hide shrink-0 py-2 px-1">
              <div className="relative group">
                <select
                  name="model"
                  title="Select Model"
                  id="model-select"
                  className="block w-full sm:w-auto min-w-[160px] rounded-full border border-zinc-700 bg-zinc-900/50 backdrop-blur-md p-2.5 px-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-zinc-800"
                  value={selectedModel}
                  onChange={handleModelChange}
                >
                  {models.map((model) => (
                    <option key={model.value} value={model.value} className="bg-zinc-900 text-zinc-100">
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 w-full items-center">
                {[
                  {
                    label: "Make Shorter",
                    value: "Make it Shorter and simpler.",
                  },
                  {
                    label: "Make Longer",
                    value: "Make it longer. explain it nicely",
                  },
                  {
                    label: "Professional",
                    value: "Write it in a more professional tone.",
                  },
                  {
                    label: "Casual",
                    value: "Write it in a more casual and light tone.",
                  },
                  { label: "Paraphrase", value: "Paraphrase it" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.value)}
                    className="rounded-full border border-zinc-700/50 bg-zinc-800/40 backdrop-blur-sm px-4 py-2 text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50 transition-all active:scale-95 whitespace-nowrap"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        chats={chats}
        currentChatId={currentChatId}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onContinueChat={handleContinueChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
      />

      {/* Notifications */}
      <NotificationContainer />
    </>
  );
});

ChatContainer.displayName = "ChatContainer";

export default ChatContainer;
