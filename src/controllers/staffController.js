import mongoose from "mongoose";
import { readData, updateData } from "../store.js";
import { normalizeEmail, initials } from "../utils.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { resolveStaffForUser } from "../utils/userHelpers.js";

export const getStaffBookings = asyncHandler(async (req, res) => {
  const data = await readData();
  const user = data.users.find((item) => item.id === req.authUser.id);
  if (!user) {
    throw httpError(401, "Session invalid");
  }

  if (user.status !== "active") {
    res.json([]);
    return;
  }

  const staffRef = resolveStaffForUser(data, user);
  if (!staffRef) {
    res.json([]);
    return;
  }

  res.json(data.bookings.filter((booking) => Number(booking.staffId) === Number(staffRef.id)));
});


export const updateStaffServices = asyncHandler(async (req, res) => {
  const selected = Array.isArray(req.body?.services)
    ? [...new Set(req.body.services.map(Number).filter(Number.isFinite))]
    : null;

  if (!selected) {
    throw httpError(400, "Services array is required");
  }

  let updated;
  await updateData(async (data) => {
    const user = data.users.find((item) => item.id === req.authUser.id);
    if (!user || user.status !== "active") {
      throw httpError(403, "Staff account is not active");
    }

    const staffRef = resolveStaffForUser(data, user);
    if (!staffRef) {
      throw httpError(404, "Staff profile not found");
    }

    staffRef.services = selected;
    updated = staffRef;
    return updated;
  });

  res.json(updated);
});

export const updateStaffAvailability = asyncHandler(async (req, res) => {
  const { avail, availability } = req.body || {};
  console.log(`[BACKEND] Received availability update request for staff. availability: ${availability?.length}, avail: ${avail?.length}`);

  const user = req.authUser;
  if (!user || user.status !== "active") {
    throw httpError(403, "Staff account is not active");
  }

  // Find staff record
  let staff = await mongoose.model("Staff").findOne({ 
    $or: [{ id: user.staffId }, { email: user.email }] 
  });

  if (!staff) {
    throw httpError(404, "Staff profile not found");
  }

  const update = {};
  if (Array.isArray(availability) && availability.length === 7) {
    console.log(`[BACKEND] Updating staff ${staff.name} with new structure`);
    update.availability = availability;
    update.avail = availability.map(a => !!a.enabled);
  } else if (Array.isArray(avail) && avail.length === 7) {
    console.log(`[BACKEND] Updating staff ${staff.name} with legacy structure`);
    update.avail = avail.map(Boolean);
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    update.availability = avail.map((en, i) => ({
      day: DAYS[i],
      enabled: !!en,
      startTime: staff.availability?.[i]?.startTime || "09:00",
      endTime: staff.availability?.[i]?.endTime || "18:00"
    }));
  } else {
    throw httpError(400, "Valid availability or avail array of 7 elements is required");
  }

  console.log(`[BACKEND] Executing update for staff ${staff.name} with:`, JSON.stringify(update));
  
  const updatedStaff = await mongoose.model("Staff").findOneAndUpdate(
    { _id: staff._id },
    { $set: update },
    { new: true, runValidators: false }
  ).lean();

  if (!updatedStaff) {
    console.error(`[BACKEND] FAILED to update staff ${staff.name}`);
  } else {
    console.log(`[BACKEND] SUCCESS: Saved staff ${updatedStaff.name}. availability slots in response: ${updatedStaff.availability?.length || 0}`);
  }

  res.json(updatedStaff);
});

export const updateStaffProfile = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const role = String(req.body?.role || "").trim();
  const email = normalizeEmail(req.body?.email);
  const profileImage = String(req.body?.profileImage || "").trim();
  const experience = String(req.body?.experience || "").trim();
  const totalWorkDone = parseInt(req.body?.totalWorkDone || 0, 10) || 0;
  const bio = String(req.body?.bio || "").trim();

  if (!name) throw httpError(400, "Name is required");
  if (!role) throw httpError(400, "Role is required");
  if (!email.includes("@")) throw httpError(400, "A valid email is required");

  let updated;
  await updateData(async (data) => {
    const user = data.users.find((item) => item.id === req.authUser.id);
    if (!user || user.status !== "active") {
      throw httpError(403, "Staff account is not active");
    }

    const staffRef = resolveStaffForUser(data, user);
    if (!staffRef) {
      throw httpError(404, "Staff profile not found");
    }

    const duplicateStaff = data.staff.find(
      (item) => item.id !== staffRef.id && normalizeEmail(item.email) === email
    );
    if (duplicateStaff) throw httpError(409, "Another staff profile already uses this email");

    const duplicateUser = data.users.find(
      (item) => item.id !== user.id && normalizeEmail(item.email) === email
    );
    if (duplicateUser && duplicateUser.role !== "staff") {
      throw httpError(409, "Email already belongs to another account");
    }

    const oldName = staffRef.name;
    staffRef.name = name;
    staffRef.role = role;
    staffRef.email = email;
    staffRef.i = initials(name);
    staffRef.profileImage = profileImage;
    staffRef.experience = experience;
    staffRef.totalWorkDone = totalWorkDone;
    staffRef.bio = bio;

    user.name = name;
    user.email = email;
    user.roleTitle = role;

    if (oldName !== name) {
      data.bookings.forEach((booking) => {
        if (booking.stf === oldName) {
          booking.stf = name;
        }
      });
    }

    updated = staffRef;
    return updated;
  });

  res.json(updated);
});

export const updateStaffRate = asyncHandler(async (req, res) => {
  const hourlyRate = parseFloat(req.body?.hourlyRate || 0);
  if (isNaN(hourlyRate) || hourlyRate < 0) throw httpError(400, "Invalid hourly rate");

  let updated;
  await updateData(async (data) => {
    const user = data.users.find((item) => item.id === req.authUser.id);
    if (!user || user.status !== "active") throw httpError(403, "Staff account is not active");

    const staffRef = resolveStaffForUser(data, user);
    if (!staffRef) throw httpError(404, "Staff profile not found");

    staffRef.hourlyRate = hourlyRate;
    updated = staffRef;
    return updated;
  });

  res.json(updated);
});
