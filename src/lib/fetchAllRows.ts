import { supabase } from "@/integrations/supabase/client";

// Fetch all rows from a table by paginating in blocks of 1000 to bypass Supabase's default 1000-row cap
export async function fetchAllRows<T>(tableName: string, orderBy: string = "id"): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  let all: T[] = [];

  // Defensive: loop protection with max 50 pages (50k rows) to avoid accidental infinite loops
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order(orderBy as any, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`Erro ao paginar tabela ${tableName}:`, error);
      throw error;
    }

    const batch = (data || []) as T[];
    all = all.concat(batch);

    if (batch.length < pageSize) break; // last page reached
    from += pageSize;
  }

  return all;
}
