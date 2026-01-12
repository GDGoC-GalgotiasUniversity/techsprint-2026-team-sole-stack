import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  smoothStream,
  streamText,
  UIMessage,
} from "ai";
import { SYSTEM_PROMPT } from "../../../lib/systemPrompt";

export const dynamic = "force-dynamic";
// Removed export of maxDuration per recent request (not used by streamText here)

export async function POST(req: Request) {
  try {
    const {
      messages,
      selectedModel,
    }: {
      messages: UIMessage[];
      selectedModel: string;
    } = await req.json();

    // Basic validation: ensure messages is present and non-empty
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      // Return a JSON error response instead of streaming an error frame
      return new Response(JSON.stringify({ error: "Invalid prompt: messages must not be empty" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Sanitize incoming messages to avoid sending provider-specific
    // unsupported fields (for example `reasoning`) to the model API.
    // Some UI message parts (like 'reasoning') are intended for display
    // only and must not be included in the model prompt.
    const sanitizeMessagesForModel = (msgs: UIMessage[] | any[]): UIMessage[] => {
      return msgs.map((m) => {
        // shallow copy
        const copy: any = { ...m };
        // remove any top-level `reasoning` field if present
        if ('reasoning' in copy) {
          delete copy.reasoning;
          // keep a lightweight console warning for debugging on server
          console.warn('Stripped unsupported top-level `reasoning` field from message before sending to model.');
        }

        // sanitize parts array if present: drop parts of type 'reasoning'
        if (Array.isArray(copy.parts)) {
          copy.parts = copy.parts.filter((p: any) => p?.type !== 'reasoning');
        }

        return copy as UIMessage;
      });
    };

    const sanitized: UIMessage[] = sanitizeMessagesForModel(messages);

    const result = streamText({
      model: google(selectedModel ?? "gemini-2.0-flash"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(sanitized),
      maxRetries: 3,
      experimental_transform: smoothStream({
        chunking: "word",
      }),
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Log the error and return a safe JSON response for easier debugging
    console.error("/api/chat error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
