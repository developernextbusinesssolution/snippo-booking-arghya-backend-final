export const MNS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
export const STEPS = ["Account", "Identity", "Done"];
export const COLORS = ["#E63946", "#7c3aed", "#0891b2", "#059669", "#f59e0b", "#ec4899"];

export function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function parsePath(pathname) {
  const p = pathname.replace(/^\/+|\/+$/g, '');
  const parts = p ? p.split('/') : [];
  if (!parts.length || p === '') return { page: 'home', sub: null };
  if (parts[0] === 'book' && parts[1]) return { page: 'book_service', sub: parts[1] };
  if (parts[0] === 'admin') {
    if (parts.length === 1) return { page: 'admin_login', sub: null };
    if (parts[1] === 'dashboard') return { page: 'admin_dash', sub: parts[2] || 'overview' };
  }
  if (parts[0] === 'staff') {
    if (parts.length === 1) return { page: 'staff_auth', sub: null };
    if (parts[1] === 'dashboard') return { page: 'staff_dash', sub: parts[2] || 'schedule' };
  }
  if (parts[0] === 'user') {
    if (parts[1] === 'dashboard') return { page: 'user_dash', sub: parts[2] || 'bookings' };
  }
  if (parts[0] === 'payment' && parts[1]) return { page: 'payment', sub: parts[1] };
  return { page: 'home', sub: null };
  return { page: 'home', sub: null };
}

export function buildPath(page, sub) {
  const map = {
    home: '/',
    book_service: sub ? `/book/${sub}` : '/',
    admin_login: '/admin',
    admin_dash: sub ? `/admin/dashboard/${sub}` : '/admin/dashboard',
    staff_auth: '/staff',
    staff_dash: sub ? `/staff/dashboard/${sub}` : '/staff/dashboard',
    user_dash: sub ? `/user/dashboard/${sub}` : '/user/dashboard',
    payment: sub ? `/payment/${sub}` : '/',
  };
  return map[page] || '/';
}

export const cal = (y, m) => {
  const f = new Date(y, m, 1).getDay();
  const d = new Date(y, m + 1, 0).getDate();
  return [...Array(f).fill(null), ...Array.from({ length: d }, (_, i) => i + 1)];
};

export const fmtDur = (m) => {
  const n = parseInt(m);
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const r = n % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
};

export const initials = (n) =>
  String(n).split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

export const COMMISSION_RATE = 0.15;


export const calcCommissionPrice = (rate) => {
  if (!rate || rate <= 0) return 0;
  return Math.round(rate * (1 + COMMISSION_RATE));
};

export function formatDateForUi(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}
