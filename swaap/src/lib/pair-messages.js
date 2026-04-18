/** RTDB path for 1:1 chat between two Firebase auth uids (order-independent). */
export function pairMessagesPath(uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return `pair_messages/${a}/${b}/items`;
}

/** Event-scoped thread (host ↔ attendee) so admins can list chats per signup. */
export function eventPairMessagesPath(eventId, uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return `event_pair_messages/${eventId}/${a}/${b}/items`;
}
