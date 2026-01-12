import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { UIMessage } from "ai";

export interface SavedChat {
  id: string;
  messages: UIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

// Supabase-based chat history manager. Methods are async.
export class SupabaseChatHistoryManager {
  private table = "chats";
  // Default page size for paginated fetches
  public readonly DEFAULT_PAGE_SIZE = 50;

  private ensureConfigured(): void {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
  }

  async getAllChats(): Promise<SavedChat[]> {
    this.ensureConfigured();
    const { data, error } = await supabase
      .from(this.table)
      .select("id, messages, model, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Supabase getAllChats error:", error);
      return [];
    }

    return (
      (data as any[]).map((row) => ({
        id: row.id,
        messages: row.messages,
        model: row.model,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      })) || []
    );
  }

  // Paginated fetch: from = 0-based index, pageSize = number of items
  async getChatsPage(pageSize = this.DEFAULT_PAGE_SIZE, from = 0): Promise<SavedChat[]> {
    this.ensureConfigured();
    const to = from + pageSize - 1; // range is inclusive
    const { data, error } = await supabase
      .from(this.table)
      .select("id, messages, model, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase getChatsPage error:", error);
      return [];
    }

    return (
      (data as any[]).map((row) => ({
        id: row.id,
        messages: row.messages,
        model: row.model,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      })) || []
    );
  }

  async getChatById(id: string): Promise<SavedChat | null> {
    this.ensureConfigured();
    const { data, error } = await supabase.from(this.table).select("*").eq("id", id).single();
    if (error) {
      console.error("Supabase getChatById error:", error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      messages: data.messages,
      model: data.model,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  async saveChat(chat: Omit<SavedChat, "id" | "createdAt" | "updatedAt">): Promise<SavedChat | null> {
    this.ensureConfigured();
    const now = new Date().toISOString();
    const newRow = {
      messages: chat.messages,
      model: chat.model,
      created_at: now,
      updated_at: now,
    } as any;

    const { data, error } = await supabase.from(this.table).insert(newRow).select().single();
    if (error) {
      // Log the raw Supabase error for debugging and surface it to callers by throwing.
      console.error("Supabase saveChat error:", error);
      // Throw an Error so callers can surface the real message instead of a generic null.
      throw new Error(error?.message || JSON.stringify(error));
    }

    return {
      id: data.id,
      messages: data.messages,
      model: data.model,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  async updateChat(id: string, updates: Partial<Pick<SavedChat, "messages" | "model">>): Promise<boolean> {
    this.ensureConfigured();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.messages) payload.messages = updates.messages;
    if (updates.model) payload.model = updates.model;

    const { error } = await supabase.from(this.table).update(payload).eq("id", id);
    if (error) {
      console.error("Supabase updateChat error:", error);
      return false;
    }
    return true;
  }

  async deleteChat(id: string): Promise<boolean> {
    this.ensureConfigured();
    const { error } = await supabase.from(this.table).delete().eq("id", id);
    if (error) {
      console.error("Supabase deleteChat error:", error);
      return false;
    }
    return true;
  }

  async clearAllChats(): Promise<boolean> {
    this.ensureConfigured();
    const { error } = await supabase.from(this.table).delete();
    if (error) {
      console.error("Supabase clearAllChats error:", error);
      return false;
    }
    return true;
  }
}

export const supabaseChatHistoryManager = new SupabaseChatHistoryManager();
