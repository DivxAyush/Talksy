// ─── Centralized Message Merge Utility (Optimized with Set-based dedup) ───
export const mergeMessages = (prev, incoming, isAppend = false) => {
  if (!incoming || incoming.length === 0) return prev;
  if (!prev || prev.length === 0) return incoming;

  const mergedMap = new Map();
  
  if (isAppend) {
    // Pagination: existing messages come FIRST (newest), incoming comes LAST (older)
    prev.forEach(m => mergedMap.set(m._id || m.clientId, m));
    incoming.forEach(m => {
      const id = m._id || m.clientId;
      if (!mergedMap.has(id)) {
        mergedMap.set(id, m);
      } else {
        // Update existing with server data
        mergedMap.set(id, { ...mergedMap.get(id), ...m });
      }
    });
  } else {
    // Sync/New/Realtime: incoming messages come FIRST (newest), existing follows
    incoming.forEach(m => mergedMap.set(m._id || m.clientId, m));
    prev.forEach(m => {
      const id = m._id || m.clientId;
      if (!mergedMap.has(id)) {
        mergedMap.set(id, m);
      }
      // If we already have it from incoming (server/new), we don't overwrite with old local data
    });
  }
  return Array.from(mergedMap.values());
};

export const getCacheKey = (userId1, userId2) => {
  return [userId1, userId2].sort().join("_");
};
