import { google } from "@ai-sdk/google";
import { convertToModelMessages } from "ai";
import { SYSTEM_PROMPT } from "../../../../lib/systemPrompt";

// This route orchestrates chunked generation by repeatedly calling the
// local `/api/chat` endpoint for successive chunks and streaming the
// accumulated output back to the client as a simple text stream.

export const dynamic = "force-dynamic";

type Body = {
  messages: any[]; // UIMessage[] (kept loose here to avoid heavy imports)
  selectedModel?: string;
  targetWords?: number; // approximate target output size in words
  chunkWords?: number; // approximate words per chunk
  maxIterations?: number; // safety cap
};

export async function POST(req: Request) {
  try {
    const { messages, selectedModel, targetWords = 500000, chunkWords = 2000, maxIterations = 500 }: Body = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be provided" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    // Build the absolute URL for the internal chat endpoint
    const chatUrl = new URL("/api/chat", req.url).toString();

    // Stream response back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let producedWords = 0;
          let iterations = 0;
          let contextMessages = [...messages];

          while (producedWords < targetWords && iterations < maxIterations) {
            iterations++;

            // Ask the model to continue and produce a chunk of roughly chunkWords words.
            // We append a directive to the last user message to keep things simple.
            const continuationPrompt = `\n\n-- CONTINUE: Please continue the previous output. Produce up to ${chunkWords} words in this response, and then stop. If you have finished the whole text, indicate completion by outputting the token <END_OF_OUTPUT> on its own line.`;

            // Create a shallow copy of messages and append a user continuation request
            const msgsForThisChunk = [...contextMessages, { role: "user", content: continuationPrompt }];

            // Call the local /api/chat endpoint which wraps the model. We use a fetch to the same server
            // so the existing request/stream handling remains unchanged.
            const resp = await fetch(chatUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ messages: msgsForThisChunk, selectedModel }),
            });

            if (!resp.ok) {
              const bodyText = await resp.text();
              controller.enqueue(encoder.encode(`\n\n[error chunk ${iterations}]: ${resp.status} ${bodyText}\n`));
              break;
            }

            // Read the full response text for this chunk (we assume the /api/chat call will complete per-chunk)
            const chunkText = await resp.text();

            // Push chunk to client
            controller.enqueue(encoder.encode(chunkText));

            // Roughly estimate words produced (simple split on whitespace)
            const words = chunkText.trim().split(/\s+/).filter(Boolean).length;
            producedWords += words;

            // If the model explicitly indicated end token, stop early
            if (chunkText.includes("<END_OF_OUTPUT>")) {
              controller.enqueue(encoder.encode("\n\n[generation complete]\n"));
              break;
            }

            // Append the assistant's chunk as an assistant message in context for the next iteration
            contextMessages = [...contextMessages, { role: "assistant", content: chunkText }];

            // small throttle to avoid tight loop
            await new Promise((res) => setTimeout(res, 100));
          }

          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`\n\n[generate-large error] ${String(err)}\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("/api/chat/generate-large error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
