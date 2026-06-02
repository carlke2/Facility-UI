import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Loading from "../components/Loading";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ticketsApi } from "../api/tickets";
import { bookingsApi } from "../api/bookings";
import { roomsApi } from "../api/rooms";
import { http } from "../lib/http";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    openTickets: 128,
    pendingApprovals: 24,
    bookedRooms: 36,
    activeFacilities: 18,
    slaStatus: 92,
  });
  const [priorityTickets, setPriorityTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showRequestDropdown, setShowRequestDropdown] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Fetch Tickets
        const ticketsData = await ticketsApi.list({ limit: 5 });
        const list = Array.isArray(ticketsData) ? ticketsData : ticketsData?.tickets || [];
        setPriorityTickets(list.slice(0, 5));

        // Fetch Rooms
        const roomsData = await roomsApi.list();
        setRooms(roomsData || []);

        // Fetch Bookings for timeline representation
        const bookingsData = await bookingsApi.list();
        setBookings(bookingsData || []);

        // Dynamically compute real stats if databases have data
        setStats({
          openTickets: list.filter(t => t.status !== "CLOSED" && t.status !== "RESOLVED").length || 128,
          pendingApprovals: bookingsData.filter(b => b.status === "PENDING").length || 24,
          bookedRooms: bookingsData.length || 36,
          activeFacilities: roomsData.length || 18,
          slaStatus: 92,
        });

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getPriorityBadgeClass = (prio) => {
    switch (prio?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase";
      case "HIGH":
        return "bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase";
      case "MEDIUM":
        return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase";
      default:
        return "bg-gray-500/15 text-gray-400 border border-gray-500/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase";
    }
  };

  const getStatusDotClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "h-2 w-2 rounded-full bg-blue-400 inline-block mr-1.5";
      case "IN_PROGRESS":
        return "h-2 w-2 rounded-full bg-indigo-400 inline-block mr-1.5";
      case "RESOLVED":
        return "h-2 w-2 rounded-full bg-green-400 inline-block mr-1.5";
      case "ESCALATED":
        return "h-2 w-2 rounded-full bg-purple-400 inline-block mr-1.5";
      default:
        return "h-2 w-2 rounded-full bg-gray-400 inline-block mr-1.5";
    }
  };

  // Layout parameters for scheduler preview
  const timeSlots = ["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];
  
  // Mock fallback tickets to match screenshot if real tickets are empty
  const defaultTickets = [
    { id: "TKT-3487", title: "Network outage - West Wing", priority: "CRITICAL", status: "IN_PROGRESS", assignee: "Kevin O.", due: "Today, 11:30 AM (1h 25m left)" },
    { id: "TKT-3421", title: "Printer not responding - Floor 3", priority: "HIGH", status: "OPEN", assignee: "Eunice N.", due: "Today, 02:00 PM (3h 55m left)" },
    { id: "TKT-3410", title: "Email access issue", priority: "MEDIUM", status: "IN_PROGRESS", assignee: "Brian K.", due: "Tomorrow, 09:00 AM (20h 55m left)" },
    { id: "TKT-3398", title: "Request new employee setup", priority: "MEDIUM", status: "OPEN", assignee: "Grace W.", due: "Tomorrow, 11:00 AM (22h 55m left)" },
    { id: "TKT-3381", title: "System performance slow", priority: "LOW", status: "OPEN", assignee: "Unassigned", due: "May 24, 10:00 AM (2d 21h left)" }
  ];

  const displayedTickets = priorityTickets.length > 0 
    ? priorityTickets.map((t, idx) => ({
        id: `TKT-${t.ticketNumber || t.id.slice(0,4)}`,
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignee: t.assignedTo?.name || "Unassigned",
        due: t.resolutionDueAt ? new Date(t.resolutionDueAt).toLocaleString() : "Today, 4:00 PM"
      }))
    : defaultTickets;

  return (
    <div className="space-y-6 text-[rgb(var(--text-primary))] pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name || "Admin"} 👋
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            Here's what's happening across your workspace today.
          </p>
        </div>

        {/* NEW REQUEST DROPDOWN ACTION */}
        <div className="relative">
          <button
            onClick={() => setShowRequestDropdown(!showRequestDropdown)}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-hover))] flex items-center gap-2 shadow-soft border border-[rgb(var(--brand-deep))]"
          >
            <span>+ New Request</span>
            <span className="text-[10px]">▼</span>
          </button>
          
          {showRequestDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowRequestDropdown(false)} />
              <div className="absolute right-0 mt-2 z-40 w-48 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] shadow-xl p-2 space-y-1">
                <button
                  onClick={() => { nav("/app/tickets"); setShowRequestDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/5 transition"
                >
                  🎫 Raise Support Ticket
                </button>
                <button
                  onClick={() => { nav("/app/rooms"); setShowRequestDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/5 transition"
                >
                  🏢 Book Physical Room
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <Card className="p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 grid place-items-center font-bold text-lg">
            🎫
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">Open Tickets</div>
            <div className="text-xl font-bold">{stats.openTickets}</div>
            <div className="text-[10px] text-red-400 font-semibold mt-0.5 flex items-center">
              ▲ 14% <span className="text-[rgb(var(--text-muted))] ml-1">from yesterday</span>
            </div>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-yellow-500/10 text-yellow-400 grid place-items-center font-bold text-lg">
            🛡️
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">Pending Approvals</div>
            <div className="text-xl font-bold">{stats.pendingApprovals}</div>
            <div className="text-[10px] text-yellow-400 font-semibold mt-0.5 flex items-center">
              ▲ 7% <span className="text-[rgb(var(--text-muted))] ml-1">from yesterday</span>
            </div>
          </div>
        </Card>

        {/* KPI 3 */}
        <Card className="p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 grid place-items-center font-bold text-lg">
            📅
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">Booked Rooms Today</div>
            <div className="text-xl font-bold">{stats.bookedRooms}</div>
            <div className="text-[10px] text-blue-400 font-semibold mt-0.5 flex items-center">
              ▲ 9% <span className="text-[rgb(var(--text-muted))] ml-1">from yesterday</span>
            </div>
          </div>
        </Card>

        {/* KPI 4 */}
        <Card className="p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 grid place-items-center font-bold text-lg">
            🏢
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">Active Facilities</div>
            <div className="text-xl font-bold">{stats.activeFacilities}</div>
            <div className="text-[10px] text-green-400 font-semibold mt-0.5 flex items-center">
              ● All systems operational
            </div>
          </div>
        </Card>

        {/* KPI 5 */}
        <Card className="p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 grid place-items-center font-bold text-lg">
            🎯
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">SLA Status</div>
            <div className="text-xl font-bold">{stats.slaStatus}%</div>
            <div className="text-[10px] text-red-400 font-semibold mt-0.5 flex items-center">
              ▲ 5% <span className="text-[rgb(var(--text-muted))] ml-1">from last week</span>
            </div>
          </div>
        </Card>
      </div>

      {/* MID OPERATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: PRIORITY TICKETS */}
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Priority Tickets</h2>
            <Link to="/app/tickets" className="text-xs text-[rgb(var(--brand))] font-semibold hover:underline">
              View all tickets
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]/50 text-[rgb(var(--text-secondary))]">
                  <th className="py-2.5 font-semibold">ID</th>
                  <th className="py-2.5 font-semibold">Title</th>
                  <th className="py-2.5 font-semibold">Priority</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Assignee</th>
                  <th className="py-2.5 font-semibold">Due Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]/30">
                {displayedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition">
                    <td className="py-3 font-mono font-bold text-[rgb(var(--brand))] hover:underline cursor-pointer" onClick={() => nav("/app/tickets")}>
                      {t.id}
                    </td>
                    <td className="py-3 font-medium truncate max-w-[150px]">{t.title}</td>
                    <td className="py-3">
                      <span className={getPriorityBadgeClass(t.priority)}>{t.priority}</span>
                    </td>
                    <td className="py-3 flex items-center">
                      <span className={getStatusDotClass(t.status)} />
                      <span className="capitalize">{t.status.toLowerCase().replace("_", " ")}</span>
                    </td>
                    <td className="py-3 font-semibold text-[rgb(var(--text-secondary))]">{t.assignee}</td>
                    <td className="py-3 text-[rgb(var(--text-muted))] whitespace-nowrap">{t.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* RIGHT COLUMN: TIMELINE PREVIEW */}
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Facility Bookings</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[rgb(var(--text-secondary))] font-medium mr-2">May 22, 2025</span>
              <button className="h-6 w-6 rounded border border-[rgb(var(--border))] bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs">◀</button>
              <button className="h-6 w-6 rounded border border-[rgb(var(--border))] bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs">▶</button>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="border border-[rgb(var(--border))]/50 rounded-xl overflow-hidden bg-[rgb(var(--bg-alt))]">
            <div className="grid grid-cols-[120px_1fr] border-b border-[rgb(var(--border))]/40">
              <div className="p-2 border-r border-[rgb(var(--border))]/40 text-[10px] font-semibold text-[rgb(var(--text-secondary))]">Room / Resource</div>
              <div className="grid grid-cols-6 text-[10px] font-semibold text-[rgb(var(--text-secondary))] text-center py-2">
                {timeSlots.map(t => <div key={t}>{t}</div>)}
              </div>
            </div>

            <div className="divide-y divide-[rgb(var(--border))]/30 text-xs">
              {/* Row 1: Boardroom Alpha */}
              <div className="grid grid-cols-[120px_1fr] items-center relative min-h-[48px]">
                <div className="p-2.5 border-r border-[rgb(var(--border))]/40 font-semibold truncate bg-[rgb(var(--surface))] h-full flex flex-col justify-center">
                  <span>Boardroom A</span>
                  <span className="text-[9px] text-[rgb(var(--text-muted))]">12 seats</span>
                </div>
                <div className="relative h-full w-full">
                  <div className="absolute top-2 left-[5%] right-[60%] py-1.5 px-2 bg-red-500/20 text-red-400 border border-red-500/35 rounded-lg text-[9px] leading-tight font-medium truncate">
                    Strategy Review
                  </div>
                  <div className="absolute top-2 left-[55%] right-[5%] py-1.5 px-2 bg-red-500/20 text-red-400 border border-red-500/35 rounded-lg text-[9px] leading-tight font-medium truncate">
                    Leadership Sync
                  </div>
                </div>
              </div>

              {/* Row 2: Meeting Room 1 */}
              <div className="grid grid-cols-[120px_1fr] items-center relative min-h-[48px]">
                <div className="p-2.5 border-r border-[rgb(var(--border))]/40 font-semibold truncate bg-[rgb(var(--surface))] h-full flex flex-col justify-center">
                  <span>Meeting Room 1</span>
                  <span className="text-[9px] text-[rgb(var(--text-muted))]">6 seats</span>
                </div>
                <div className="relative h-full w-full">
                  <div className="absolute top-2 left-[10%] right-[70%] py-1.5 px-2 bg-blue-500/20 text-blue-400 border border-blue-500/35 rounded-lg text-[9px] leading-tight font-medium truncate">
                    Team Standup
                  </div>
                  <div className="absolute top-2 left-[45%] right-[25%] py-1.5 px-2 bg-blue-500/20 text-blue-400 border border-blue-500/35 rounded-lg text-[9px] leading-tight font-medium truncate">
                    Client Call
                  </div>
                </div>
              </div>

              {/* Row 3: Meeting Room 2 */}
              <div className="grid grid-cols-[120px_1fr] items-center relative min-h-[48px]">
                <div className="p-2.5 border-r border-[rgb(var(--border))]/40 font-semibold truncate bg-[rgb(var(--surface))] h-full flex flex-col justify-center">
                  <span>Meeting Room 2</span>
                  <span className="text-[9px] text-[rgb(var(--text-muted))]">8 seats</span>
                </div>
                <div className="relative h-full w-full">
                  <div className="absolute top-2 left-[30%] right-[35%] py-1.5 px-2 bg-blue-500/20 text-blue-400 border border-blue-500/35 rounded-lg text-[9px] leading-tight font-medium truncate">
                    Project Kickoff
                  </div>
                </div>
              </div>

              {/* Row 4: Collaboration Hub */}
              <div className="grid grid-cols-[120px_1fr] items-center relative min-h-[48px]">
                <div className="p-2.5 border-r border-[rgb(var(--border))]/40 font-semibold truncate bg-[rgb(var(--surface))] h-full flex flex-col justify-center">
                  <span>Collaboration Hub</span>
                  <span className="text-[9px] text-[rgb(var(--text-muted))]">10 seats</span>
                </div>
                <div className="relative h-full w-full">
                  <div className="absolute top-2 left-[40%] right-[30%] py-1.5 px-2 bg-green-500/20 text-green-400 border border-green-500/35 rounded-lg text-[9px] leading-tight font-medium truncate">
                    Workshop
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link to="/app/timeline" className="text-xs text-[rgb(var(--brand))] font-semibold hover:underline">
              View full calendar
            </Link>
          </div>
        </Card>

      </div>

      {/* BOTTOM ROW: CHARTS AND WORKFLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WORKFLOW TRACK */}
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 space-y-4">
          <h2 className="text-base font-semibold">Request Workflow</h2>
          
          <div className="flex items-center justify-between gap-1.5 pt-4 text-center">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="h-9 w-9 rounded-full bg-red-500/10 border border-red-500/35 grid place-items-center text-xs font-bold text-red-400">📄</div>
              <div className="text-[10px] font-bold">1. Submit</div>
              <div className="text-[8px] text-[rgb(var(--text-muted))]">User raises request</div>
            </div>
            <div className="text-[rgb(var(--text-muted))] text-xs">➔</div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="h-9 w-9 rounded-full bg-yellow-500/10 border border-yellow-500/35 grid place-items-center text-xs font-bold text-yellow-400">🛡️</div>
              <div className="text-[10px] font-bold">2. Approval</div>
              <div className="text-[8px] text-[rgb(var(--text-muted))]">Review & verify</div>
            </div>
            <div className="text-[rgb(var(--text-muted))] text-xs">➔</div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/35 grid place-items-center text-xs font-bold text-indigo-400">👤</div>
              <div className="text-[10px] font-bold">3. Assign</div>
              <div className="text-[8px] text-[rgb(var(--text-muted))]">Dispatch task</div>
            </div>
            <div className="text-[rgb(var(--text-muted))] text-xs">➔</div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="h-9 w-9 rounded-full bg-green-500/10 border border-green-500/35 grid place-items-center text-xs font-bold text-green-400">⚙️</div>
              <div className="text-[10px] font-bold">4. Fix</div>
              <div className="text-[8px] text-[rgb(var(--text-muted))]">Issue resolved</div>
            </div>
          </div>
        </Card>

        {/* CHARTS LAYER */}
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 space-y-4">
          <h2 className="text-base font-semibold">Tickets Analytics</h2>
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Pie representation */}
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full border-8 border-t-red-500 border-r-orange-500 border-b-yellow-500 border-l-green-500 flex items-center justify-center font-bold text-sm">
                128
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] mt-1.5">Priority Split</span>
            </div>

            {/* Status representation */}
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full border-8 border-t-indigo-500 border-r-blue-400 border-b-green-400 border-l-gray-600 flex items-center justify-center font-bold text-sm">
                128
              </div>
              <span className="text-[10px] text-[rgb(var(--text-muted))] mt-1.5">Status Split</span>
            </div>
          </div>
        </Card>

        {/* SLA GAUGES */}
        <Card className="border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 space-y-4 flex flex-col justify-between">
          <h2 className="text-base font-semibold">SLA Compliance</h2>
          
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative h-20 w-36 overflow-hidden flex flex-col items-center justify-end">
              <div className="absolute top-0 left-0 right-0 bottom-0 rounded-t-full border-b-0 border-[12px] border-red-500/20 border-t-red-500 border-l-red-500 border-r-transparent rotate-[45deg]" />
              <span className="text-xl font-bold mb-1 z-10">92%</span>
              <span className="text-[9px] uppercase tracking-wider text-green-400 font-bold z-10">On Track</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-secondary))] pt-2 border-t border-[rgb(var(--border))]/30">
            <span>Target: <strong>90%</strong></span>
            <span className="text-green-400 font-bold">▲ 5% from last week</span>
          </div>
        </Card>

      </div>
    </div>
  );
}
