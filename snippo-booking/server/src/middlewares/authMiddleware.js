import { pool, rowToUser } from "../store.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { getBearerToken, verifyToken } from "../auth.js";

async function resolveTokenUser(req) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [payload.id]);
    const user = rowToUser(res.rows[0]);
    return user || null;
  } catch {
    return null;
  }
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.authUser = await resolveTokenUser(req);
  next();
});

export function requireAuth(roles = []) {
  return asyncHandler(async (req, _res, next) => {
    const user = await resolveTokenUser(req);
    if (!user) {
      throw httpError(401, "Authentication required");
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      throw httpError(403, "Forbidden");
    }
    req.authUser = user;
    next();
  });
}
