/** Public Scooplist v1 contract. Invalid updates must never replace a good board. */
export type FeedFlavor = { name: string; description: string; allergens: string[]; tags: string[] };
export type FeedBoard = { key: string; label: string; flavors: FeedFlavor[] };
export type CaseFeed = { updatedAt: number | null; boards: FeedBoard[] };

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid feed object.');
  return value as Record<string, unknown>;
};
const text = (value: unknown, max: number, required = false) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('Invalid feed text.');
  return value.trim();
};
const list = (value: unknown, max: number) => {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid feed list.');
  return value;
};

export function validateCaseFeed(raw: unknown, shop: string, now = Date.now()): CaseFeed {
  const data = object(raw);
  if (object(data.location).id !== shop) throw new Error('Feed belongs to a different shop.');
  if (data.updatedAt !== null && (typeof data.updatedAt !== 'number' || !Number.isSafeInteger(data.updatedAt) || data.updatedAt <= 0 || data.updatedAt > now + 300000)) throw new Error('Invalid feed update time.');
  const keys = new Set<string>();
  const boards = list(data.boards, 20).map(rawBoard => {
    const board = object(rawBoard), key = text(board.key, 80, true), label = text(board.label, 120, true);
    if (keys.has(key)) throw new Error('Duplicate feed board.');
    keys.add(key);
    const names = new Set<string>();
    const flavors = list(board.flavors, 200).map(rawFlavor => {
      const flavor = object(rawFlavor), name = text(flavor.name, 120, true);
      if (names.has(name)) throw new Error('Duplicate feed flavor.');
      names.add(name);
      return { name, description: text(flavor.description, 1000), allergens: list(flavor.allergens, 20).map(value => text(value, 80, true)), tags: list(flavor.tags, 20).map(value => text(value, 80, true)) };
    });
    return { key, label, flavors };
  });
  return { updatedAt: data.updatedAt as number | null, boards };
}
