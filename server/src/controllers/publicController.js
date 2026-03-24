import { readData } from "../store.js";
import { asyncHandler } from "../utils/errorHelpers.js";

export const getHealth = (req, res) => {
  res.json({ ok: true });
};

export const getBootstrap = asyncHandler(async (req, res) => {
  const data = await readData();
  const authUser = req.authUser;

  const isAdmin = authUser?.role === "admin";
  const services = isAdmin ? data.services : data.services.filter((service) => service.active);
  const staff = isAdmin ? data.staff : data.staff.filter((member) => member.active);

  let bookings = [];
  let pendingStaff = [];
  
  // Scrubbed list of all upcoming/active bookings to block out timeslots globally
  const busySlots = data.bookings
    .filter(b => ["upcoming", "active"].includes(b.s))
    .map(b => ({ staffId: b.staffId, dt: b.dt, t: b.t }));

  if (authUser) {
    if (authUser.role === "admin") {
      bookings = data.bookings;
      pendingStaff = data.pendingStaff;
    } else if (authUser.role === "user") {
      bookings = data.bookings.filter((booking) => booking.userId === authUser.id);
    } else if (authUser.role === "staff") {
      // Inline resolveStaffForUser logic
      const sRef = data.staff.find((member) =>
        (authUser.staffId !== undefined && authUser.staffId !== null && member.id === authUser.staffId) ||
        (member.email.toLowerCase() === authUser.email.toLowerCase())
      );
      bookings = sRef
        ? data.bookings.filter((booking) => booking.stf === sRef.name)
        : [];
    }
  }

  res.json({
    services,
    staff,
    bookings,
    busySlots,
    pendingStaff,
    stripePublishableKey: process.env.STRIPE_PUBLIC_KEY?.trim() || null,
  });
});
