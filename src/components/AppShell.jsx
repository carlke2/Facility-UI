// src/components/AppShell.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

function SideLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-xl px-4 py-3 transition text-base sm:text-sm ${
          isActive
            ? "bg-[rgb(var(--brand))]/12 text-[rgb(var(--text))] border border-[rgb(var(--brand))]/30"
            : "text-[rgb(var(--text))] hover:bg-white/5 border border-transparent"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function getDisplayName(user) {
  const name = typeof user?.name === "string" ? user.name.trim() : "";
  const email = typeof user?.email === "string" ? user.email.trim() : "";
  if (name) return name;
  if (email) return email;
  return "Unknown";
}

function getInitial(label) {
  const s = String(label || "").trim();
  return s ? s[0].toUpperCase() : "U";
}

function getPageTitle(pathname) {
  // order matters (more specific first)
  const rules = [
    { re: /^\/app\/admin\/schedule/, title: "Full Schedule" },
    { re: /^\/app\/admin\/rooms/, title: "Manage Rooms" },
    { re: /^\/app\/admin\/activity/, title: "Activity Logs" },

    { re: /^\/app\/timeline/, title: "Day View" },
    { re: /^\/app\/my-bookings/, title: "My Bookings" },
    { re: /^\/app\/rooms/, title: "Rooms" },
    { re: /^\/app\/reminders/, title: "Reminders" },
    { re: /^\/app\/tickets/, title: "Support Tickets" },

    { re: /^\/app\/?$/, title: "Dashboard" },
  ];

  for (const r of rules) {
    if (r.re.test(pathname)) return r.title;
  }
  return "Dashboard";
}

export default function AppShell() {
  const { user, logout, isAuthed, booting } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";
  const displayName = getDisplayName(user);
  const initial = getInitial(displayName);
  const roleLabel = (user?.role || "USER").toUpperCase();

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  // Prevent back navigation weirdness after entering /app
  useEffect(() => {
    if (booting) return;
    if (!isAuthed) return;

    if (location.pathname.startsWith("/app")) {
      nav(".", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, isAuthed]);

  // Set browser tab title
  useEffect(() => {
    document.title = `${pageTitle} • Boardroom`;
  }, [pageTitle]);

  // close profile menu when route changes
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  function doLogout() {
    logout();
    nav("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">
        {/* SIDEBAR */}
        <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 h-fit shadow-soft flex flex-col justify-between" style={{ minHeight: "calc(100vh - 3rem)" }}>
          <div className="flex flex-col">
            {/* BRAND LOGO */}
            <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-[rgb(var(--border))]/40">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-950/40">
                M
              </div>
              <div className="leading-tight">
                <div className="text-xs font-black uppercase tracking-wider text-white">Millenium</div>
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Solutions</div>
              </div>
            </div>

            <div className="space-y-1">
              <SideLink to="/app">Dashboard</SideLink>
              <SideLink to="/app/tickets">Tickets</SideLink>
              <SideLink to="/app/my-bookings">Facility Booking</SideLink>
              <SideLink to="/app/timeline">Calendar</SideLink>
              <SideLink to="/app/rooms">Rooms</SideLink>
              <SideLink to="/app/assets">Assets</SideLink>
              <SideLink to="/app/reminders">Approvals</SideLink>
              <SideLink to="/app/admin/activity">Reports</SideLink>
              <SideLink to="/app/settings">Settings</SideLink>
            </div>

            {isAdmin ? (
              <>
                <div className="mt-6 px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-[rgb(var(--muted))] border-t border-[rgb(var(--border))]/40">
                  Admin System
                </div>
                <div className="space-y-1">
                  <SideLink to="/app/admin/schedule">Full Schedule</SideLink>
                  <SideLink to="/app/admin/rooms">Manage Rooms</SideLink>
                </div>
              </>
            ) : null}
          </div>

          {/* BOTTOM SUPPORT WIDGET */}
          <div className="mt-8 p-4 rounded-2xl border border-[rgb(var(--border))]/50 bg-[rgb(var(--bg-alt))]/60 text-center space-y-3">
            <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 grid place-items-center mx-auto text-sm font-bold">
              🎧
            </div>
            <div className="text-[11px] font-bold text-white">Need Support?</div>
            <div className="text-[9px] text-[rgb(var(--text-muted))]">Our team is ready<br/>to help you.</div>
            <Button onClick={() => nav("/app/tickets")} className="w-full py-1.5 rounded-xl text-[10px] uppercase font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white">
              Contact Support
            </Button>
            <div className="text-[8px] text-[rgb(var(--text-muted))] pt-2">
              © 2025 Millenium Solutions EA<br/>All rights reserved.
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0">
          {/* TOP BAR */}
          <div className="sticky top-3 z-30">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/85 backdrop-blur shadow-soft px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-[rgb(var(--muted))]">Boardroom</div>
                <div className="text-lg sm:text-xl font-semibold text-[rgb(var(--text))] truncate">
                  {pageTitle}
                </div>
              </div>

              {/* PROFILE */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-white/5 hover:bg-white/10 px-3 py-2 transition"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold leading-4 truncate max-w-[180px]">
                      {displayName}
                    </div>
                    {user?.email ? (
                      <div className="text-xs text-[rgb(var(--muted))] truncate max-w-[180px]">
                        {user.email}
                      </div>
                    ) : null}
                  </div>

                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-[rgb(var(--brand))]/15 grid place-items-center text-[rgb(var(--text))] font-bold text-base border border-[rgb(var(--brand))]/25">
                    {initial}
                  </div>
                </button>

                {profileOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 z-50 w-72 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] shadow-soft p-3">
                      <div className="px-2 py-2">
                        <div className="text-sm font-semibold truncate">{displayName}</div>
                        {user?.email ? (
                          <div className="text-xs text-[rgb(var(--muted))] truncate">
                            {user.email}
                          </div>
                        ) : null}

                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--text))] border border-[rgb(var(--border))]">
                            {roleLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 border-t border-[rgb(var(--border))] pt-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-center py-3 text-sm"
                          onClick={doLogout}
                        >
                          Logout
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="mt-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
