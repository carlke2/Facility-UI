import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Alert from "../components/Alert";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { ticketsApi } from "../api/tickets";
import { roomsApi } from "../api/rooms";
import { http } from "../lib/http";

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Selection & Details
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Modal / Inputs for actions
  const [assigneeId, setAssigneeId] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Creation Wizard
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
    roomId: "",
  });

  const isStaff = ["ADMIN", "PM", "SUPPORT_COORDINATOR", "TECHNICIAN", "DEVELOPER"].includes(
    user?.role?.toUpperCase()
  );
  const isAdminOrPM = ["ADMIN", "PM", "SUPPORT_COORDINATOR"].includes(user?.role?.toUpperCase());

  // Fetch initial rooms and users
  useEffect(() => {
    async function loadData() {
      try {
        const roomsList = await roomsApi.list();
        setRooms(roomsList || []);
      } catch (err) {
        console.error("Failed to load rooms list", err);
      }

      if (isStaff) {
        try {
          const { data } = await http.get("/users");
          setStaffUsers(data || []);
        } catch (err) {
          console.error("Failed to load users list for assignments", err);
        }
      }
    }
    loadData();
  }, [isStaff]);

  // Load tickets list
  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;
      if (priorityFilter !== "ALL") filters.priority = priorityFilter;
      if (categoryFilter !== "ALL") filters.category = categoryFilter;

      // Non-staff can only see their own tickets, backend handles this or we can filter
      const data = await ticketsApi.list(filters);
      setTickets(Array.isArray(data) ? data : data?.tickets || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  // Load selected ticket details & comments
  const loadTicketDetails = async (id) => {
    setLoadingComments(true);
    try {
      const ticket = await ticketsApi.findOne(id);
      setSelectedTicket(ticket);
      
      const commentsList = await ticketsApi.getComments(id, isStaff);
      setComments(commentsList || []);
      
      setAssigneeId(ticket.assignedToId || "");
      setShowEscalateForm(false);
      setShowResolveForm(false);
      setEscalateReason("");
      setResolutionNote("");
    } catch (err) {
      setError("Failed to load ticket details.");
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadTicketDetails(selectedId);
    } else {
      setSelectedTicket(null);
      setComments([]);
    }
  }, [selectedId]);

  // Create Ticket Submit
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setError("Title and Description are required.");
      return;
    }
    try {
      const payload = {
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
      };
      if (newTicket.roomId) payload.roomId = newTicket.roomId;

      await ticketsApi.create(payload);
      setSuccess("Ticket submitted successfully!");
      setNewTicket({
        title: "",
        description: "",
        category: "GENERAL",
        priority: "MEDIUM",
        roomId: "",
      });
      setShowCreateWizard(false);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create support ticket.");
    }
  };

  // Add Comment Submit
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await ticketsApi.addComment(selectedTicket.id, {
        body: commentText,
        isInternal: isInternalComment && isStaff,
      });
      setCommentText("");
      setIsInternalComment(false);
      loadTicketDetails(selectedTicket.id);
    } catch (err) {
      setError("Failed to add comment.");
    }
  };

  // Assign Technician
  const handleAssign = async (targetId) => {
    setError("");
    try {
      await ticketsApi.assign(selectedTicket.id, targetId);
      setSuccess("Ticket assigned successfully!");
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to assign ticket.");
    }
  };

  // Claim Ticket
  const handleClaim = async () => {
    setError("");
    try {
      await ticketsApi.assign(selectedTicket.id, user.id);
      await ticketsApi.update(selectedTicket.id, { status: "IN_PROGRESS" });
      setSuccess("Ticket claimed successfully!");
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to claim ticket.");
    }
  };

  // Start Work
  const handleStartWork = async () => {
    setError("");
    try {
      await ticketsApi.update(selectedTicket.id, { status: "IN_PROGRESS" });
      setSuccess("Ticket status set to In Progress.");
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start work.");
    }
  };

  // Escalate Ticket
  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalateReason.trim()) return;
    setError("");
    try {
      await ticketsApi.escalate(selectedTicket.id, escalateReason);
      setSuccess("Ticket escalated successfully!");
      setShowEscalateForm(false);
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to escalate ticket.");
    }
  };

  // Resolve Ticket
  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;
    setError("");
    try {
      await ticketsApi.resolve(selectedTicket.id, resolutionNote);
      setSuccess("Ticket resolved successfully!");
      setShowResolveForm(false);
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resolve ticket.");
    }
  };

  // Close Ticket
  const handleClose = async () => {
    setError("");
    try {
      await ticketsApi.close(selectedTicket.id);
      setSuccess("Ticket closed successfully!");
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to close ticket.");
    }
  };

  const getPriorityBadgeClass = (prio) => {
    switch (prio?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border border-red-500/25";
      case "HIGH":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/25";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/25";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/25";
      case "IN_PROGRESS":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25";
      case "RESOLVED":
        return "bg-green-500/10 text-green-400 border border-green-500/25";
      case "ESCALATED":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/25";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/25";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">Support Tickets</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Raise requests, track resolutions, and manage operations.
          </p>
        </div>
        <div>
          <Button
            onClick={() => {
              setShowCreateWizard(true);
              setSelectedId(null);
            }}
            className="rounded-2xl flex items-center gap-2"
          >
            <span>+ Raise a Ticket</span>
          </Button>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? <Alert type="success">{success}</Alert> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* LEFT COLUMN: FILTERS & TICKETS LIST */}
        <div className="space-y-4">
          {/* FILTER CONTROLS */}
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1.5">
                STATUS
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-1 focus:ring-[rgb(var(--brand))]/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ESCALATED">Escalated</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1.5">
                PRIORITY
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-1 focus:ring-[rgb(var(--brand))]/20"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1.5">
                CATEGORY
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-1 focus:ring-[rgb(var(--brand))]/20"
              >
                <option value="ALL">All Categories</option>
                <option value="IT">IT Support</option>
                <option value="AV_PROJECTOR">AV / Projector</option>
                <option value="NETWORK">Network / Wi-Fi</option>
                <option value="ACCESS_CONTROL">Access Control</option>
                <option value="HVAC">HVAC / Heating & AC</option>
                <option value="WORKSPACE">Workspace / Meeting Room</option>
                <option value="VISITOR_RELATED">Visitor Incidents</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="FACILITY">Facility</option>
                <option value="GENERAL">General Request</option>
              </select>
            </div>
          </Card>

          {/* LIST */}
          {loading ? (
            <div className="py-12"><Loading /></div>
          ) : tickets.length === 0 ? (
            <Card className="p-8 text-center text-[rgb(var(--muted))]">
              No tickets found matching your filters.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <Card
                  key={t.id}
                  onClick={() => {
                    setSelectedId(t.id);
                    setShowCreateWizard(false);
                  }}
                  className={`p-4 cursor-pointer hover:border-[rgb(var(--brand))]/35 transition relative flex flex-col justify-between min-h-[160px] ${
                    selectedId === t.id
                      ? "border-[rgb(var(--brand))]/50 bg-[rgb(var(--brand))]/5"
                      : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-[rgb(var(--muted))]">
                        #{t.ticketNumber || t.id.slice(0, 8)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${getPriorityBadgeClass(t.priority)}`}>
                          {t.priority}
                        </span>
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-[rgb(var(--text))] leading-tight line-clamp-1">
                      {t.title}
                    </h3>
                    <p className="text-xs text-[rgb(var(--muted))] line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[rgb(var(--border))]/40 flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
                    <span>Category: <strong>{t.category}</strong></span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL PANEL / CREATION WIZARD */}
        <div>
          {showCreateWizard ? (
            /* CREATE WIZARD */
            <Card className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-[rgb(var(--text))]">Raise a Ticket</h2>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <Input
                  label="Title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="e.g. Printer offline in Room 302"
                  required
                />
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[rgb(var(--muted))]">Description</label>
                  <textarea
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    required
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-2 focus:ring-[rgb(var(--brand))]/20 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-[rgb(var(--muted))]">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-2"
                  >
                    <option value="GENERAL">General Service Request</option>
                    <option value="IT">IT Support</option>
                    <option value="AV_PROJECTOR">AV / Projector</option>
                    <option value="NETWORK">Network / Wi-Fi</option>
                    <option value="ACCESS_CONTROL">Access Control</option>
                    <option value="HVAC">HVAC / Heating & AC</option>
                    <option value="WORKSPACE">Workspace / Meeting Room</option>
                    <option value="VISITOR_RELATED">Visitor Incidents</option>
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="FACILITY">Facility</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[rgb(var(--muted))]">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-2"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[rgb(var(--muted))]">Room Link</label>
                    <select
                      value={newTicket.roomId}
                      onChange={(e) => setNewTicket({ ...newTicket, roomId: e.target.value })}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40 focus:ring-2"
                    >
                      <option value="">None / General</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="w-full rounded-xl">
                    Submit Ticket
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateWizard(false)}
                    className="w-full rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          ) : selectedTicket ? (
            /* DETAIL PANEL */
            <Card className="p-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[rgb(var(--muted))]">
                    #{selectedTicket.ticketNumber || selectedTicket.id.slice(0, 8)}
                  </span>
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${getStatusBadgeClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                
                <h2 className="text-lg font-semibold text-[rgb(var(--text))]">{selectedTicket.title}</h2>
                <p className="text-xs text-[rgb(var(--muted))]">
                  Raised by: <strong>{selectedTicket.createdBy?.name || "Requester"}</strong> on {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-b border-[rgb(var(--border))]/40 py-3 text-sm space-y-2">
                <div>
                  <span className="text-[rgb(var(--muted))]">Description:</span>
                  <p className="mt-1 text-[rgb(var(--text))] text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[rgb(var(--muted))]">Priority:</span>{" "}
                    <span className="font-semibold text-[rgb(var(--text))]">{selectedTicket.priority}</span>
                  </div>
                  <div>
                    <span className="text-[rgb(var(--muted))]">Category:</span>{" "}
                    <span className="font-semibold text-[rgb(var(--text))]">{selectedTicket.category}</span>
                  </div>
                  {selectedTicket.room ? (
                    <div className="col-span-2">
                      <span className="text-[rgb(var(--muted))]">Room Link:</span>{" "}
                      <span className="font-semibold text-[rgb(var(--text))]">{selectedTicket.room.name} ({selectedTicket.room.location})</span>
                    </div>
                  ) : null}
                  {selectedTicket.assignedTo ? (
                    <div className="col-span-2">
                      <span className="text-[rgb(var(--muted))]">Assignee:</span>{" "}
                      <span className="font-semibold text-[rgb(var(--text))]">{selectedTicket.assignedTo.name}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ACTION BUTTONS (ROLE AWARE) */}
              <div className="space-y-2">
                {isStaff && selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                  <div className="grid grid-cols-2 gap-2">
                    {!selectedTicket.assignedToId && (
                      <Button onClick={handleClaim} className="rounded-xl w-full text-xs">
                        Claim Ticket
                      </Button>
                    )}
                    {selectedTicket.status === "OPEN" && selectedTicket.assignedToId === user.id && (
                      <Button onClick={handleStartWork} className="rounded-xl w-full text-xs">
                        Start Work
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setShowResolveForm(true);
                        setShowEscalateForm(false);
                      }}
                      className="rounded-xl w-full text-xs bg-green-600 hover:bg-green-700"
                    >
                      Resolve Fix
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEscalateForm(true);
                        setShowResolveForm(false);
                      }}
                      className="rounded-xl w-full text-xs bg-purple-600 hover:bg-purple-700"
                    >
                      Escalate
                    </Button>
                  </div>
                )}

                {isAdminOrPM && selectedTicket.status === "RESOLVED" && (
                  <Button onClick={handleClose} className="rounded-xl w-full bg-indigo-600 hover:bg-indigo-700">
                    Close Ticket
                  </Button>
                )}

                {/* Assignment Select Dropdown for Admin/PM */}
                {isAdminOrPM && selectedTicket.status !== "CLOSED" && (
                  <div className="space-y-1 mt-2">
                    <label className="text-xs font-semibold text-[rgb(var(--muted))]">
                      REASSIGN TICKET
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => handleAssign(e.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-1.5 text-xs text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--brand))]/40"
                    >
                      <option value="">Unassigned</option>
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sub-action forms */}
                {showEscalateForm && (
                  <form onSubmit={handleEscalate} className="p-3 border border-[rgb(var(--border))] rounded-xl bg-purple-500/5 space-y-2 mt-2">
                    <Input
                      label="Escalation Reason"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      placeholder="Why are you escalating this ticket?"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="w-full text-xs py-1.5">Submit</Button>
                      <Button type="button" variant="ghost" className="w-full text-xs py-1.5" onClick={() => setShowEscalateForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {showResolveForm && (
                  <form onSubmit={handleResolve} className="p-3 border border-[rgb(var(--border))] rounded-xl bg-green-500/5 space-y-2 mt-2">
                    <Input
                      label="Resolution Fix Notes"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Detail the actions taken to fix the issue."
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="w-full text-xs py-1.5">Submit</Button>
                      <Button type="button" variant="ghost" className="w-full text-xs py-1.5" onClick={() => setShowResolveForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>

              {/* COMMENTS TIMELINE */}
              <div className="space-y-3 pt-3 border-t border-[rgb(var(--border))]/40">
                <h3 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">Timeline & Discussion</h3>
                
                {loadingComments ? (
                  <Loading />
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {selectedTicket.resolutionNote && (
                      <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                        <span className="text-[10px] uppercase font-bold text-green-400">Resolution Note</span>
                        <p className="text-xs text-[rgb(var(--text))] mt-1 leading-relaxed">{selectedTicket.resolutionNote}</p>
                      </div>
                    )}
                    
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          c.isInternal
                            ? "bg-amber-500/10 border-amber-500/20 text-[rgb(var(--text))]"
                            : "bg-[rgb(var(--surface2))] border-[rgb(var(--border))]/30 text-[rgb(var(--text))]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[rgb(var(--muted))] mb-1.5">
                          <span className="font-semibold">
                            {c.author?.name} {c.isInternal && <strong className="text-amber-400 ml-1">(Internal Work Note)</strong>}
                          </span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>{c.body}</p>
                      </div>
                    ))}
                    {comments.length === 0 && !selectedTicket.resolutionNote && (
                      <p className="text-xs text-[rgb(var(--muted))] text-center py-2">No comments or activity logs yet.</p>
                    )}
                  </div>
                )}

                {/* Add Comment Input */}
                {selectedTicket.status !== "CLOSED" && (
                  <form onSubmit={handleAddComment} className="space-y-2 mt-2">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a reply to this ticket..."
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface2))] px-3 py-2 text-xs text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-[rgb(var(--brand))]/40"
                    />
                    <div className="flex items-center justify-between gap-2">
                      {isStaff ? (
                        <label className="flex items-center gap-2 text-[11px] text-[rgb(var(--muted))] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded border-[rgb(var(--border))] bg-[rgb(var(--surface2))] text-[rgb(var(--brand))]"
                          />
                          <span>Internal Work Note</span>
                        </label>
                      ) : <div />}
                      <Button type="submit" className="rounded-xl px-4 py-1.5 text-xs">
                        Comment
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          ) : (
            /* EMPTY VIEW */
            <Card className="p-8 text-center text-[rgb(var(--muted))] flex flex-col items-center justify-center min-h-[300px]">
              <div className="h-12 w-12 rounded-full bg-[rgb(var(--brand))]/10 text-[rgb(var(--brand))] grid place-items-center mb-3">
                🎫
              </div>
              <p className="text-sm font-semibold">No Ticket Selected</p>
              <p className="text-xs mt-1">Select a ticket card from the left panel, or click "+ Raise a Ticket" to report a new operational issue.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
