import { env } from "@/lib/env";
import type { StorageProvider } from "@/modules/stockage/StorageProvider";
import { LocalStorageProvider } from "@/modules/stockage/local/LocalStorageProvider";
import { SupabaseStorageProvider } from "@/modules/stockage/supabase/SupabaseStorageProvider";

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;
  instance =
    env.STORAGE_PROVIDER === "supabase"
      ? new SupabaseStorageProvider()
      : new LocalStorageProvider();
  return instance;
}
