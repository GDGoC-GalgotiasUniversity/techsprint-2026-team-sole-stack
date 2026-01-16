"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import groqpic from "@/assets/groq.jpg";
import sparkles from "@/assets/Sparkle.svg";
import send from "@/assets/send.svg";
import robo from "@/assets/Robo.svg";
import copy from "@/assets/copy.svg";
import { ImageUpload, UploadedImage } from "./ImageUpload";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { getModelByValue } from "@/lib/model";

export function ChatSession({
  model,
  userIp,
  input,
  setInputAction,
  modelControls,
  initialMessages,
  onMessagesChange,
}: {
  model: string;
  userIp: string;
  input: string;
  setInputAction: (v: string) => void;
  modelControls?: React.ReactNode;
  initialMessages?: UIMessage[];
  onMessagesChange?: (messages: UIMessage[]) => void;
}) {
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>(
    {}
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const startTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentModel = getModelByValue(model);
  const supportsVision = currentModel?.supportsVision || false;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { selectedModel: model },
      }),
    [model]
  );

  const initialMessagesRef = useRef<UIMessage[] | undefined>(initialMessages);

  const { messages, status, error, sendMessage, stop } = useChat({
    transport,
    messages: initialMessagesRef.current,
    onFinish: ({ message }) => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      setResponseTimes((prev) => ({ ...prev, [message.id]: duration }));
    },
  });

  const messagesUpdateTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!onMessagesChange) return;

    if (messagesUpdateTimerRef.current) {
      window.clearTimeout(messagesUpdateTimerRef.current);
      messagesUpdateTimerRef.current = null;
    }

    messagesUpdateTimerRef.current = window.setTimeout(() => {
      try {
        onMessagesChange(messages);
      } catch (err) {
        console.error("onMessagesChange handler threw:", err);
      }
      messagesUpdateTimerRef.current = null;
    }, 200);

    return () => {
      if (messagesUpdateTimerRef.current) {
        window.clearTimeout(messagesUpdateTimerRef.current);
        messagesUpdateTimerRef.current = null;
      }
    };
  }, [messages, onMessagesChange]);

  const isLoading = status === "streaming";

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() && images.length === 0) return;

      startTimeRef.current = Date.now();
      const parts: any[] = [];
      if (input.trim()) {
        parts.push({ type: "text", text: input.trim() });
      }

      if (images.length > 0 && supportsVision) {
        if (isSupabaseConfigured()) {
          const uploadPromises = images.map(async (image) => {
            try {
              const filename = `${Date.now()}_${image.file.name}`;
              const bucket = "uploads";
              const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filename, image.file as File, { upsert: false });

              if (error) {
                console.error("Supabase upload error:", error);
                return {
                  type: "file",
                  mediaType: image.file.type,
                  url: image.base64,
                };
              }

              const { data: publicData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

              return {
                type: "file",
                mediaType: image.file.type,
                url: publicData.publicUrl,
              };
            } catch (err) {
              console.error("upload exception:", err);
              return {
                type: "file",
                mediaType: image.file.type,
                url: image.base64,
              };
            }
          });

          const uploadedParts = await Promise.all(uploadPromises);
          uploadedParts.forEach((p) => parts.push(p));
        } else {
          images.forEach((image) => {
            parts.push({ type: "file", mediaType: image.file.type, url: image.base64 });
          });
        }
      }

      sendMessage({ parts });
      setInputAction("");
      setImages([]);
    },
    [input, images, sendMessage, setInputAction, supportsVision]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto w-full h-full p-4 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m) => (
              <div key={m.id} className="group w-full animate-fade-in">
                {m.role === "user" ? (
                  <div className="flex flex-row-reverse items-start gap-4">
                    <img
                      alt="user"
                      className="size-8 rounded-full shadow-lg ring-1 ring-zinc-700"
                      src={getAvatarUrl(userIp)}
                      width={32}
                      height={32}
                    />
                    <div className="flex flex-col items-end max-w-[85%]">
                      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md">
                        {m.parts.some((part) => part.type === "text") && (
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {m.parts.map((part, index) =>
                              part.type === "text" ? (
                                <span key={index}>{part.text}</span>
                              ) : null
                            )}
                          </p>
                        )}
                        {m.parts.some((part) => part.type === "file") && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {m.parts.map((part, index) =>
                              part.type === "file" && part.mediaType?.startsWith("image/") ? (
                                <Image
                                  key={index}
                                  src={part.url}
                                  alt="User uploaded image"
                                  width={200}
                                  height={200}
                                  className="rounded-lg object-cover shadow-sm border border-white/20"
                                />
                              ) : null
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row items-start gap-4">
                    <div className="relative size-8 shrink-0">
                      <Image
                        alt="groq"
                        className="rounded-full shadow-lg ring-1 ring-zinc-700"
                        src={groqpic}
                        placeholder="blur"
                        fill
                        sizes="32px"
                      />
                    </div>

                    <div className="flex flex-col max-w-full overflow-hidden">
                      <div className="glass-panel px-6 py-5 rounded-2xl rounded-tl-sm text-zinc-100 shadow-sm markdown-body w-full">
                        {m.parts.map((part) => {
                          if (part.type === "reasoning") {
                            return (
                              <div
                                key={`${m.id}-reasoning`}
                                className="text-sm mb-4 p-4 border border-zinc-700/50 rounded-lg bg-zinc-900/50 text-zinc-400"
                              >
                                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-medium text-xs uppercase tracking-wider">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                  </span>
                                  Thinking Process
                                </div>
                                <div className="pl-4 border-l-2 border-zinc-700 italic">
                                  <Markdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>{part.text}</Markdown>
                                </div>
                              </div>
                            );
                          }
                          if (part.type === "text") {
                            const parsed = parseThinkingContent(part.text);
                            return (
                              <div key={`${m.id}-text`}>
                                {parsed.hasReasoning &&
                                  parsed.reasoning.map((reasoningText, index) => (
                                    <div
                                      key={`${m.id}-parsed-reasoning-${index}`}
                                      className="text-sm mb-4 p-4 border border-zinc-700/50 rounded-lg bg-zinc-900/50 text-zinc-400"
                                    >
                                      <div className="flex items-center gap-2 mb-2 text-cyan-400 font-medium text-xs uppercase tracking-wider">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                        </span>
                                        Thinking Process
                                      </div>
                                      <div className="pl-4 border-l-2 border-zinc-700 italic">
                                        <Markdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>{reasoningText}</Markdown>
                                      </div>
                                    </div>
                                  ))}
                                {parsed.cleanText && (
                                  <Markdown
                                    remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                                    components={{
                                      table: ({ children }) => (
                                        <div className="overflow-x-auto my-4 border border-zinc-800 rounded-lg">
                                          <table className="min-w-full divide-y divide-zinc-800">{children}</table>
                                        </div>
                                      ),
                                    }}
                                  >
                                    {parsed.cleanText}
                                  </Markdown>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}

                        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                          {responseTimes[m.id] && (
                            <span className="text-xs text-zinc-500 font-mono">
                              {responseTimes[m.id].toFixed(2)}s
                            </span>
                          )}
                          <button
                            type="button"
                            title="Copy response"
                            className="p-1.5 rounded-full text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            onClick={() => {
                              const textContent = m.parts
                                .filter((part) => part.type === "text")
                                .map((part) => {
                                  const parsed = parseThinkingContent(part.text);
                                  return parsed.cleanText || part.text;
                                })
                                .join("");
                              navigator.clipboard.writeText(textContent);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 px-4 py-2 animate-pulse text-cyan-400">
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="font-medium text-sm tracking-wide">GENERATING RESPONSE...</span>
              </div>
            )}
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl text-sm mx-auto max-w-2xl">
                Error: {String((error as any)?.message || error)}
              </div>
            )}
            <div ref={messagesEndRef} className="pb-4" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <Image
                src={robo}
                id="pic"
                alt="AI Assistant"
                width={180}
                className="relative z-10 drop-shadow-2xl brightness-90 contrast-125"
                priority
              />
            </div>
            <h2 className="mt-8 text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent tracking-tight">
              Gemini Pro
            </h2>
            <p className="mt-3 text-zinc-500 text-center max-w-md">
              Advanced AI workspace powered by Google Technologies.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 pb-6">
        {modelControls && <div className="mb-4">{modelControls}</div>}

        <div className="relative glass-panel rounded-2xl p-2 transition-all focus-within:ring-1 focus-within:ring-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          {supportsVision && (
            <ImageUpload
              images={images}
              {...({ onImagesChange: setImages } as any)}
              disabled={isLoading}
              isOpen={isImageUploadOpen}
              onToggle={() => setIsImageUploadOpen(!isImageUploadOpen)}
            />
          )}

          <form onSubmit={handleSubmit} className="flex flex-col">
            {supportsVision && (
              <div className="absolute left-4 top-4 z-10">
                <button
                  type="button"
                  onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
                  className={`p-2 rounded-lg transition-all ${isImageUploadOpen
                      ? "text-cyan-400 bg-cyan-950/50"
                      : "text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800"
                    }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                </button>
              </div>
            )}

            <textarea
              className={`w-full bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:ring-0 resize-none py-3.5 min-h-[56px] ${supportsVision ? 'pl-14' : 'pl-4'} pr-24 leading-relaxed`}
              placeholder="How can I help you today?"
              rows={1}
              value={input}
              onChange={(e) => setInputAction(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />

            <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={() => stop && stop()}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Stop generating"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && images.length === 0}
                  className="p-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9" /></svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function getAvatarUrl(ip: string): string {
  const encodedIp = encodeURIComponent(ip);
  return `https://xvatar.vercel.app/api/avatar/${encodedIp}?rounded=120&size=240&userLogo=true`;
}

export function parseThinkingContent(text: string) {
  const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi;
  const matches = [];
  let match;
  let cleanedText = text;

  while ((match = thinkingRegex.exec(text)) !== null) {
    matches.push({
      type: "reasoning" as const,
      text: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  cleanedText = text.replace(thinkingRegex, "").trim();

  return {
    reasoning: matches.map((m) => m.text),
    cleanText: cleanedText,
    hasReasoning: matches.length > 0,
  };
}
