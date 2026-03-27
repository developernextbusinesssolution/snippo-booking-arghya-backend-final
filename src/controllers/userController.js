import { updateData } from "../store.js";
import { normalizeEmail } from "../utils.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { sanitizeUser } from "../auth.js";

export const updateUserProfile = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const phone = String(req.body?.phone || "").trim();

  if (!name) {
    throw httpError(400, "Name is required");
  }
  if (!email.includes("@")) {
    throw httpError(400, "A valid email is required");
  }

  let updated;
  await updateData(async (data) => {
    const user = data.users.find((item) => item.id === req.authUser.id);
    if (!user || user.role !== "user") {
      throw httpError(401, "Session invalid");
    }

    const duplicate = data.users.find(
      (item) => item.id !== user.id && normalizeEmail(item.email) === email
    );
    if (duplicate) {
      throw httpError(409, "Email already in use");
    }

    const oldName = user.name;
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = String(req.body?.address || "").trim();
    user.city = String(req.body?.city || "").trim();
    user.state = String(req.body?.state || "").trim();
    user.zip = String(req.body?.zip || "").trim();
    user.country = String(req.body?.country || "").trim();

    data.bookings.forEach((booking) => {
      if (booking.userId === user.id && booking.u === oldName) {
        booking.u = name;
      }
    });

    updated = sanitizeUser(user);
    return updated;
  });

  res.json({ user: updated });
});
