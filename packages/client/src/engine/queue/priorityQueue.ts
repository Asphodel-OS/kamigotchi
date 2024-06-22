/**
 * Simple priority queue
 * @returns priority queue object
 */
export function createPriorityQueue<T>() {
  const queue = new Map<string, { element: T; priority: number }>();

  function queueByPriority() {
    // Entries with a higher priority get executed first
    return [...queue.entries()].sort((a, b) => (a[1].priority >= b[1].priority ? -1 : 1));
  }

  function add(id: string, element: T, priority = 1) {
    queue.set(id, { element, priority });
  }

  function remove(id: string) {
    queue.delete(id);
  }

  function setPriority(id: string, priority: number) {
    const entry = queue.get(id);
    if (!entry) return;
    queue.set(id, { ...entry, priority });
  }

  function next(): T | undefined {
    if (queue.size === 0) return;
    const [key, value] = queueByPriority()[0]!;
    if (queue.has(key)) queue.delete(key);
    return value.element;
  }

  function size(): number {
    return queue.size;
  }

  return { add, remove, setPriority, next, size };
}
