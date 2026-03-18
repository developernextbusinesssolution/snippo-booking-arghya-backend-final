import pg from "pg";
import { hashPassword } from "./auth.js";
import { INITIAL_SERVICES, INITIAL_STAFF } from "./constants.js";
import { normalizeEmail } from "./utils.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export function rowToUser(r) {
  if (!r) return null;
  return { id: r.id, name: r.name, email: r.email, passwordHash: r.password_hash, role: r.role, status: r.status, phone: r.phone || "", roleTitle: r.role_title || "", staffId: r.staff_id || null, pendingId: r.pending_id || null, idDocument: r.id_document || null };
}
function rowToService(r) {
  if (!r) return null;
  return { id: r.id, name: r.name, desc: r.description || "", price: parseFloat(r.price), dur: r.duration || "60", img: r.image || "", active: r.active };
}
function rowToStaff(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    email: r.email,
    i: r.initials || "",
    c: r.color || "#E63946",
    services: r.services || [],
    avail: r.availability || [true,true,true,true,true,false,false],
    active: r.active,
    profileImage: r.profile_image || "",
    experience: r.experience || "",
    totalWorkDone: r.total_work_done || 0,
    bio: r.bio || "",
    hourlyRate: parseFloat(r.hourly_rate || 0),
    rating: parseFloat(r.rating || 0),
    reviewCount: parseInt(r.review_count || 0),
  };
}
function rowToPending(r) {
  if (!r) return null;
  return { id: r.id, userId: r.user_id, name: r.name, email: r.email, phone: r.phone || "", role: r.role || "", requestedServices: r.requested_services || [], appliedAt: r.applied_at || "", i: r.initials || "", c: r.color || "#E63946", status: r.status || "pending", idDocument: r.id_document || null };
}
function rowToBooking(r) {
  if (!r) return null;
  return { id: r.id, userId: r.user_id, svc: r.service_name, stf: r.staff_name, dt: r.date_label, t: r.time_label, p: r.price, s: r.status, paid: r.paid, u: r.customer_name, serviceId: r.service_id, staffId: r.staff_id, notes: r.notes || "", createdAt: r.created_at, additionalHours: r.additional_hours || 0, additionalCost: parseFloat(r.additional_cost || 0), originalDuration: r.original_duration || "" };
}
function rowToEmailTemplate(r) {
  if (!r) return null;
  return { id: r.id, subject: r.subject, body: r.body };
}

export async function nextCounter(key) {
  const res = await pool.query(`UPDATE counters SET value = value + 1 WHERE key = $1 RETURNING value - 1 AS old_value`, [key]);
  if (res.rows.length === 0) {
    await pool.query(`INSERT INTO counters (key, value) VALUES ($1, 2)`, [key]);
    return 1;
  }
  return parseInt(res.rows[0].old_value);
}



async function seedSecure() {
  const adminEmail = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL || "");
  const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || "");
  const adminName = String(process.env.ADMIN_BOOTSTRAP_NAME || "Admin").trim() || "Admin";
  if (!adminEmail.includes("@")) throw new Error("SEED_MODE=secure requires ADMIN_BOOTSTRAP_EMAIL");
  if (adminPassword.length < 10) throw new Error("SEED_MODE=secure requires ADMIN_BOOTSTRAP_PASSWORD (10+ chars)");
  const adminHash = await hashPassword(adminPassword);
  await pool.query(`INSERT INTO users (id,name,email,password_hash,role,status,phone) VALUES ('adm',$1,$2,$3,'admin','active','') ON CONFLICT (id) DO NOTHING`, [adminName,adminEmail,adminHash]);
  for (const s of INITIAL_SERVICES) {
    await pool.query(`INSERT INTO services (id,name,description,price,duration,image,active) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`, [s.id,s.name,s.desc,s.price,s.dur,s.img,s.active]);
  }
  for (const s of INITIAL_STAFF) {
    await pool.query(`INSERT INTO staff (id,name,role,email,initials,color,services,availability,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`, [s.id,s.name,s.role,s.email,s.i,s.c,s.services,s.avail,s.active]);
  }
  await pool.query(`INSERT INTO counters (key,value) VALUES ('user',1),('service',7),('staff',5),('pending',1),('booking',1) ON CONFLICT (key) DO NOTHING`);
  console.log("[db] Secure seed complete.");
}

export async function initStore() {
  await pool.query("SELECT 1");
  console.log("[db] Connected to PostgreSQL (Supabase)");

  try {
    const adminEmail = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL || "");
    const adminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || "");
    const adminName = String(process.env.ADMIN_BOOTSTRAP_NAME || "Admin").trim() || "Admin";
    
    if (adminEmail.includes("@") && adminPassword.length >= 6) {
      const adminHash = await hashPassword(adminPassword);
      await pool.query(
        `INSERT INTO users (id,name,email,password_hash,role,status,phone) 
         VALUES ('adm',$1,$2,$3,'admin','active','') 
         ON CONFLICT (id) DO UPDATE SET email=$2, password_hash=$3, name=$1`, 
        [adminName,adminEmail,adminHash]
      );
      console.log(`[db] Admin credentials synced for ${adminEmail}`);
    }
  } catch(err) {
    console.warn("[db] Failed to sync admin credentials:", err.message);
  }

  const res = await pool.query(`SELECT COUNT(*) FROM users`);
  const seeded = parseInt(res.rows[0].count) > 0;
  if (!seeded) {
    try {
      await seedSecure();
    } catch (err) {
      console.warn("[db] Skipping initialization:", err.message);
    }
  }

  // Ensure email_templates table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT NOT NULL
    )
  `);

  // Add hourly_rate column to staff if not present (safe migration)
  await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0`);
  await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0`);
  await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0`);

  // Create reviews table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      booking_id TEXT REFERENCES bookings(id),
      user_id TEXT REFERENCES users(id),
      staff_id INTEGER REFERENCES staff(id),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initial templates seed
  const templates = [
    { id: 'welcome_user', subject: 'Welcome to Snippo Booking!', body: '<p>Hello {{name}},</p><p>Your account has been successfully created. You can now book services and manage your appointments online.</p><p>See you soon!</p>' },
    { id: 'user_booking_confirmation', subject: 'Booking Confirmed - {{bookingId}}', body: '<p>Hello <strong>{{name}}</strong>,</p><p>Your booking has been successfully scheduled. Here are the details:</p><div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Booking ID:</strong> {{bookingId}}</p><p><strong>Service:</strong> {{service}}</p><p><strong>Specialist:</strong> {{staff}}</p><p><strong>Date:</strong> {{date}}</p><p><strong>Time:</strong> {{time}}</p></div><p>Thank you for choosing Snippo Booking!</p>' },
    { id: 'staff_booking_notification', subject: 'New Booking - {{bookingId}}', body: '<p>Hello {{staff}},</p><p>You have a new appointment scheduled:</p><ul><li><strong>Customer:</strong> {{name}}</li><li><strong>Service:</strong> {{service}}</li><li><strong>Date:</strong> {{date}}</li><li><strong>Time:</strong> {{time}}</li></ul>' },
    { id: 'admin_booking_alert', subject: 'Admin Alert: New Booking {{bookingId}}', body: '<h2>New Booking Logged</h2><p><strong>Customer:</strong> {{name}} ({{email}})</p><p><strong>Staff:</strong> {{staff}}</p><p><strong>Service:</strong> {{service}}</p><p><strong>DateTime:</strong> {{date}} @ {{time}}</p>' },
    { id: 'admin_user_registration', subject: 'Admin Alert: New User Registered', body: '<h2>New Customer Joined</h2><p>A new user has registered on Snippo Booking:</p><ul><li><strong>Name:</strong> {{name}}</li><li><strong>Email:</strong> {{email}}</li><li><strong>Date:</strong> {{date}}</li></ul><p>They are now ready to make bookings.</p>' },
    { id: 'staff_application_received', subject: 'Staff Application Received - Snippo', body: '<p>Hello {{name}},</p><p>Thank you for applying to join the Snippo team. Your application for <strong>{{role}}</strong> is currently under review by our administration.</p><p>We will notify you via email as soon as your account is approved.</p>' },
    { id: 'admin_staff_application_alert', subject: 'New Staff Application - Snippo', body: '<h2>New Staff Application Alert</h2><p>A new staff candidate has applied:</p><ul><li><strong>Name:</strong> {{name}}</li><li><strong>Role:</strong> {{role}}</li><li><strong>Email:</strong> {{email}}</li><li><strong>Phone:</strong> {{phone}}</li></ul><p>Please log in to the admin dashboard to review and approve their profile.</p>' },
    { id: 'staff_account_approved', subject: 'Active: Your Staff Account Approved!', body: '<p>Hello {{name}},</p><p>Congratulations! Your staff account has been approved and activated.</p><p>You can now log in to manage your schedule and start receiving bookings.</p><p>Welcome to the team!</p>' },
    { id: 'booking_extension_user', subject: 'Session Extended - {{bookingId}}', body: '<p>Hello {{name}},</p><p>Your booking <strong>{{bookingId}}</strong> has been successfully extended by {{extraHours}} hour(s).</p><p>New total duration: <strong>{{dur}} minutes</strong>.</p>' },
    { id: 'booking_extension_staff', subject: 'Session Extended: {{bookingId}}', body: '<p>Hello {{staff}},</p><p>An extra {{extraHours}} hour(s) have been added to your session with {{name}}.</p><p>New total duration: <strong>{{dur}} minutes</strong>.</p>' },
    { id: 'booking_extension_admin', subject: 'Admin Alert: Booking Extension {{bookingId}}', body: '<p>Booking <strong>{{bookingId}}</strong> was extended by {{extraHours}} hour(s).</p><ul><li><strong>Customer:</strong> {{name}}</li><li><strong>Staff:</strong> {{staff}}</li><li><strong>New Total:</strong> {{dur}} min</li></ul>' },
    { id: 'booking_completed', subject: 'Booking Completed - {{bookingId}}', body: '<p>Hello {{name}},</p><p>Your booking <strong>{{bookingId}}</strong> for {{service}} has been marked as completed.</p><div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Service:</strong> {{service}}</p><p><strong>Staff:</strong> {{staff}}</p><p><strong>Date:</strong> {{date}}</p><p><strong>Time:</strong> {{time}}</p></div><p>Thank you for using Snippo Booking!</p>' },
    { id: 'booking_cancelled', subject: 'Booking Cancelled - {{bookingId}}', body: '<p>Hello {{name}},</p><p>Your booking <strong>{{bookingId}}</strong> has been cancelled. If this was unexpected, please contact us.</p><div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Booking ID:</strong> {{bookingId}}</p><p><strong>Service:</strong> {{service}}</p><p><strong>Specialist:</strong> {{staff}}</p><p><strong>Date:</strong> {{date}}</p></div><p>We hope to see you again soon!</p>' },
    { id: 'booking_review_request', subject: 'How was your session? Rate {{staff}}', body: '<p>Hello {{name}},</p><p>We hope you enjoyed your session with {{staff}} today!</p><p>Could you take a moment to leave a review? Your feedback helps us maintain high-quality service.</p><div style="text-align: center; margin: 30px 0;"><a href="{{reviewLinkPath}}" style="background: #E63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a></div><p>If the button doesn\'t work, you can also add a review from your dashboard bookings section.</p>' }
  ];

  for (const t of templates) {
    await pool.query(`INSERT INTO email_templates (id, subject, body) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [t.id, t.subject, t.body]);
  }
}

export async function readData() {
  const [us,sv,st,p,b] = await Promise.all([
    pool.query(`SELECT * FROM users ORDER BY id`),
    pool.query(`SELECT * FROM services ORDER BY id`),
    pool.query(`SELECT * FROM staff ORDER BY id`),
    pool.query(`SELECT * FROM pending_staff`),
    pool.query(`SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100`), // Safeguard for initialization
  ]);
  return {
    users: us.rows.map(rowToUser),
    services: sv.rows.map(rowToService),
    staff: st.rows.map(rowToStaff),
    pendingStaff: p.rows.map(rowToPending),
    bookings: b.rows.map(rowToBooking),
  };
}

export async function queryPaged(table, { page = 1, limit = 10, where = "", params = [], orderBy = "id DESC" } = {}) {
  const offset = (page - 1) * limit;
  const whereCl = where ? `WHERE ${where}` : "";
  
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM ${table} ${whereCl}`, params),
    pool.query(`SELECT * FROM ${table} ${whereCl} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset])
  ]);

  const total = parseInt(countRes.rows[0].count);
  return {
    data: dataRes.rows,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function getPagedBookings({ userId, staffName, page = 1, limit = 10 } = {}) {
  let where = "";
  let params = [];
  if (userId) {
    where = "user_id = $1";
    params = [userId];
  } else if (staffName) {
    where = "staff_name = $1";
    params = [staffName];
  }

  const res = await queryPaged("bookings", { page, limit, where, params, orderBy: "created_at DESC" });
  return { ...res, data: res.data.map(rowToBooking) };
}

export async function getPagedStaff({ page = 1, limit = 10 } = {}) {
  const res = await queryPaged("staff", { page, limit, orderBy: "id" });
  return { ...res, data: res.data.map(rowToStaff) };
}

export async function getPagedUsers({ page = 1, limit = 10 } = {}) {
  const res = await queryPaged("users", { page, limit, orderBy: "id" });
  return { ...res, data: res.data.map(rowToUser) };
}

export async function updateData(mutator) {
  const data = await readData();
  const before = { users: JSON.stringify(data.users), services: JSON.stringify(data.services), staff: JSON.stringify(data.staff), pendingStaff: JSON.stringify(data.pendingStaff), bookings: JSON.stringify(data.bookings) };
  const result = await mutator(data);

  if (JSON.stringify(data.users) !== before.users) {
    for (const u of data.users) {
      await pool.query(`INSERT INTO users (id,name,email,password_hash,role,status,phone,role_title,staff_id,pending_id,id_document) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET name=$2,email=$3,password_hash=$4,role=$5,status=$6,phone=$7,role_title=$8,staff_id=$9,pending_id=$10,id_document=$11`,
        [u.id,u.name,u.email,u.passwordHash,u.role,u.status,u.phone||"",u.roleTitle||"",u.staffId||null,u.pendingId||null,u.idDocument||null]);
    }
    const ids = data.users.map(u=>u.id);
    if (ids.length > 0) await pool.query(`DELETE FROM users WHERE id != ALL($1::text[])`, [ids]);
  }

  if (JSON.stringify(data.services) !== before.services) {
    for (const s of data.services) {
      await pool.query(`INSERT INTO services (id,name,description,price,duration,image,active) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET name=$2,description=$3,price=$4,duration=$5,image=$6,active=$7`,
        [s.id,s.name,s.desc||"",s.price,s.dur||"60",s.img||"",s.active]);
    }
    const ids = data.services.map(s=>s.id);
    if (ids.length > 0) await pool.query(`DELETE FROM services WHERE id != ALL($1::int[])`, [ids]);
    else await pool.query(`DELETE FROM services`);
  }

  if (JSON.stringify(data.staff) !== before.staff) {
    for (const s of data.staff) {
      await pool.query(
        `INSERT INTO staff (id,name,role,email,initials,color,services,availability,active,profile_image,experience,total_work_done,bio,hourly_rate,rating,review_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           name=$2,role=$3,email=$4,initials=$5,color=$6,services=$7,availability=$8,active=$9,
           profile_image=$10,experience=$11,total_work_done=$12,bio=$13,hourly_rate=$14,rating=$15,review_count=$16`,
        [s.id,s.name,s.role,s.email,s.i||"",s.c||"#E63946",s.services||[],s.avail||[],s.active,
         s.profileImage||"",s.experience||"",s.totalWorkDone||0,s.bio||"",s.hourlyRate||0,s.rating||0,s.reviewCount||0]
      );
    }
    const ids = data.staff.map(s=>s.id);
    if (ids.length > 0) await pool.query(`DELETE FROM staff WHERE id != ALL($1::int[])`, [ids]);
    else await pool.query(`DELETE FROM staff`);
  }

  if (JSON.stringify(data.pendingStaff) !== before.pendingStaff) {
    for (const p of data.pendingStaff) {
      await pool.query(`INSERT INTO pending_staff (id,user_id,name,email,phone,role,requested_services,applied_at,initials,color,status,id_document) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET user_id=$2,name=$3,email=$4,phone=$5,role=$6,requested_services=$7,applied_at=$8,initials=$9,color=$10,status=$11,id_document=$12`,
        [p.id,p.userId,p.name,p.email,p.phone||"",p.role||"",p.requestedServices||[],p.appliedAt||"",p.i||"",p.c||"#E63946",p.status||"pending",p.idDocument||null]);
    }
    const ids = data.pendingStaff.map(p=>p.id);
    if (ids.length > 0) await pool.query(`DELETE FROM pending_staff WHERE id != ALL($1::text[])`, [ids]);
    else await pool.query(`DELETE FROM pending_staff`);
  }

  if (JSON.stringify(data.bookings) !== before.bookings) {
    for (const b of data.bookings) {
      await pool.query(`INSERT INTO bookings (id,user_id,service_name,staff_name,date_label,time_label,price,status,paid,customer_name,service_id,staff_id,notes,additional_hours,additional_cost,original_duration) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO UPDATE SET user_id=$2,service_name=$3,staff_name=$4,date_label=$5,time_label=$6,price=$7,status=$8,paid=$9,customer_name=$10,service_id=$11,staff_id=$12,notes=$13,additional_hours=$14,additional_cost=$15,original_duration=$16`,
        [b.id,b.userId,b.svc,b.stf,b.dt,b.t,b.p,b.s,b.paid,b.u,b.serviceId||null,b.staffId||null,b.notes||"",b.additionalHours||0,b.additionalCost||0,b.originalDuration||""]);
    }
  }

  return result;
}

export function getDataFilePath() {
  return "PostgreSQL (Supabase)";
}

export async function getUserByEmail(email) {
  const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (res.rows.length === 0) return null;
  return rowToUser(res.rows[0]);
}

export async function getStripeConfig() {
  return { 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "", 
    secretKey: process.env.STRIPE_SECRET_KEY || "" 
  };
}

export async function saveStripeConfig(config) {
  // Configured via environment variables in live mode
  return true;
}
export async function getEmailTemplates() {
  const res = await pool.query(`SELECT * FROM email_templates ORDER BY id`);
  return res.rows.map(rowToEmailTemplate);
}

export async function updateEmailTemplate(id, { subject, body }) {
  await pool.query(
    `INSERT INTO email_templates (id, subject, body) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET subject = $2, body = $3`,
    [id, subject, body]
  );
  return true;
}

export async function getEmailTemplate(id) {
  const res = await pool.query(`SELECT * FROM email_templates WHERE id = $1`, [id]);
  if (res.rows.length === 0) return null;
  return rowToEmailTemplate(res.rows[0]);
}
