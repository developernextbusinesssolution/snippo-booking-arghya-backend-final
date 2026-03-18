import { normalizeEmail } from "../utils.js";

export function userByEmail(data, email) {
  const normalized = normalizeEmail(email);
  return data.users.find((user) => normalizeEmail(user.email) === normalized);
}

export function resolveStaffForUser(data, user) {
  if (!user || user.role !== "staff") {
    return null;
  }

  if (user.staffId !== undefined && user.staffId !== null) {
    return data.staff.find((member) => member.id === user.staffId) || null;
  }

  return (
    data.staff.find((member) => normalizeEmail(member.email) === normalizeEmail(user.email)) || null
  );
}

export function resolvePendingForUser(data, user) {
  if (!user || user.role !== "staff") {
    return null;
  }

  if (user.pendingId) {
    return data.pendingStaff.find((pending) => pending.id === user.pendingId) || null;
  }

  return (
    data.pendingStaff.find((pending) => normalizeEmail(pending.email) === normalizeEmail(user.email)) ||
    null
  );
}
