/** RTDB path for 1:1 chat between two Firebase auth uids (order-independent). */
export function pairMessagesPath(uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return `pair_messages/${a}/${b}/items`;
}
