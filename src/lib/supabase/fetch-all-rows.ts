import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE = 1000;

/** Lee todas las filas (PostgREST suele limitar a 1000 por petición). */
export async function fetchAllRows<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  options?: {
    order?: { column: string; ascending?: boolean; nullsFirst?: boolean };
  },
): Promise<{ data: T[]; error: { message: string; code?: string } | null }> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select("*").range(from, from + PAGE - 1);
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
        nullsFirst: options.order.nullsFirst,
      });
    }

    const { data, error } = await query;
    if (error) return { data: all, error };
    const batch = (data ?? []) as T[];
    all.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }

  return { data: all, error: null };
}
