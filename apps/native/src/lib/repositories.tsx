import type { Repositories, Stores } from '@calma/db';
import { createContext, useContext, type ReactNode } from 'react';

/**
 * The repositories, handed down from the boot gate.
 *
 * Context rather than a module singleton so tests can mount a subtree against
 * a `MemoryStore` without a global reset between them.
 */

interface StorageValue {
  repositories: Repositories;
  stores: Stores;
  /** True when storage failed to open. Writes will not survive a restart. */
  readOnly: boolean;
}

const StorageContext = createContext<StorageValue | null>(null);

export function StorageProvider({
  value,
  children,
}: {
  value: StorageValue;
  children: ReactNode;
}) {
  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useStorage(): StorageValue {
  const value = useContext(StorageContext);
  if (!value) {
    throw new Error('useStorage was called outside the boot gate');
  }
  return value;
}

export function useRepositories(): Repositories {
  return useStorage().repositories;
}
