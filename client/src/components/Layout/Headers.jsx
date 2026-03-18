import { useState } from "react";
import BrandLogo from "../Shared/BrandLogo";

export function PublicHeader({ user, onLoginClick, onSignOut, onGoAdmin, onGoStaff, onGoDash, onGoProfile, embedMode = false }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const drawer = (
    <>
      <div className="dov" onClick={close} />
      <div className={`drw ${embedMode ? "drw-left" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <BrandLogo />
          <button className="btn btn-g btn-sm" onClick={close}>
            X
          </button>
        </div>
        {user && (
          <div style={{ padding: "9px 12px 13px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{user.email}</div>
          </div>
        )}
        {!user && (
          <>
            {!embedMode && (
              <div
                className="di"
                onClick={() => {
                  close();
                  onGoAdmin();
                }}
              >
                Admin Portal
              </div>
            )}
            {!embedMode && (
              <div
                className="di"
                onClick={() => {
                  close();
                  onGoStaff();
                }}
              >
                Staff Portal
              </div>
            )}
            <div
              className="di act"
              onClick={() => {
                close();
                onLoginClick();
              }}
            >
              <span className="mi">IN</span>Login / Register
            </div>
          </>
        )}
        {user && (
          <>
            <div
              className="di"
              onClick={() => {
                close();
                onGoDash();
              }}
            >
              <span className="mi">DB</span>My Dashboard
            </div>
            <div
              className="di"
              onClick={() => {
                close();
                (onGoProfile || onGoDash)();
              }}
            >
              <span className="mi">PR</span>Edit Profile
            </div>
            <div
              className="di"
              style={{ color: "var(--red)" }}
              onClick={() => {
                close();
                onSignOut();
              }}
            >
              <span className="mi">OUT</span>Sign Out
            </div>
          </>
        )}
      </div>
    </>
  );

  if (embedMode) {
    return (
      <>
        <div className="emb-inline">
          <button className="emb-hmb" aria-label="Open dashboard menu" onClick={() => setOpen(true)}>
            <span />
            <span />
            <span />
          </button>
        </div>
        {open && drawer}
      </>
    );
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-logo">
          <BrandLogo />
        </div>
        <div className="nav-right">
          {!user && (
            <>
              {!embedMode && (
                <button className="btn btn-o btn-sm nav-hide-sm" onClick={onGoAdmin}>
                  Admin
                </button>
              )}
              {!embedMode && (
                <button className="btn btn-o btn-sm nav-hide-sm" onClick={onGoStaff}>
                  Staff
                </button>
              )}
              <button className="btn btn-p btn-sm" onClick={onLoginClick}>
                Login / Register
              </button>
            </>
          )}
          {user && (
            <>
              <button className="btn btn-g btn-sm nav-hide-sm" onClick={onGoDash}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#E63946,#7c3aed)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {user.name?.[0]}
                </span>
                Dashboard
              </button>
              <button className="btn btn-o btn-sm nav-hide-sm" onClick={onSignOut}>
                Sign Out
              </button>
            </>
          )}
          <button
            className="btn btn-g btn-icon hmb-bars"
            id="hmb"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
      {open && drawer}
    </>
  );
}

export function AdminHeader({ admin, onSignOut }) {
  return (
    <nav className="dnav dnav-admin">
      <div style={{ marginRight: "auto" }}>
        <BrandLogo />
      </div>
      <span className="badge bx" style={{ fontSize: 11 }}>
        🛡 Admin Panel
      </span>
      <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>{admin?.name}</span>
      <button className="btn btn-danger btn-sm" onClick={onSignOut}>
        Sign Out
      </button>
    </nav>
  );
}

export function StaffHeader({ staffUser, onSignOut }) {
  return (
    <nav className="dnav dnav-staff">
      <div style={{ marginRight: "auto" }}>
        <BrandLogo />
      </div>
      <span className="badge bx" style={{ fontSize: 11 }}>
        ✂ Staff Portal
      </span>
      <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>{staffUser?.name}</span>
      <button className="btn btn-danger btn-sm" onClick={onSignOut}>
        Sign Out
      </button>
    </nav>
  );
}
