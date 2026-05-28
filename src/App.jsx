import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import Reminders from "./pages/Reminders";
import Rooms from "./pages/Rooms";
import MyBookings from "./pages/MyBookings";
import Tickets from "./pages/Tickets";

import AdminRooms from "./pages/AdminRooms";
import AdminSchedule from "./pages/AdminSchedule";
import AdminActivity from "./pages/AdminActivity";

import AdminRoute from "./routes/AdminRoute";
import { useAuth } from "./context/AuthContext";

function AuthRedirectGuard({ children }) {
  const { booting, isAuthed } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    if (booting) return;

    const path = location.pathname;

    // Auth-specific pages only (landing "/" is always viewable)
    const isAuthPage =
      path === "/login" ||
      path === "/register" ||
      path === "/forgot-password" ||
      path === "/reset-password";

    // If already authed, redirect away from login/register pages only
    if (isAuthed && isAuthPage) {
      nav("/app", { replace: true });
    }
  }, [booting, isAuthed, location.pathname, nav]);

  return children;
}

export default function App() {
  return (
    <AuthRedirectGuard>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="tickets" element={<Tickets />} />

            {/* Admin */}
            <Route path="admin" element={<AdminRoute />}>
              <Route path="rooms" element={<AdminRooms />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="activity" element={<AdminActivity />} />
            </Route>

            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthRedirectGuard>
  );
}
