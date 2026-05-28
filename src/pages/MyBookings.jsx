import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Loading from "../components/Loading";
import { bookingsApi } from "../api/bookings";

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationLabel(startAt, endAt) {
  const mins = Math.max(0, Math.round((new Date(endAt) - new Date(startAt)) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function StatusPill({ status }) {
  const s = String(status || "CONFIRMED").toUpperCase();

  // neutral pill that still reads on dark UI
  return (
    <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-white/5 px-3 py-1 text-xs font-semibold text-[rgb(var(--text))]">
      {s}
    </span>
  );
}

function DurationPill({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-white/5 px-3 py-1 text-xs font-semibold text-[rgb(var(--text))]">
      {label}
    </span>
  );
}

export default function MyBookings() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [items, setItems] = useState([]);

  async function load() {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const data = await bookingsApi.mine();
      const bookings = Array.isArray(data) ? data : data?.bookings || [];
      // hide cancelled in UI
      setItems(bookings.filter((b) => b.status !== "CANCELLED"));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelBooking(id) {
    setErr("");
    setOk("");

    // optimistic UI: remove instantly
    const prev = items;
    setItems((cur) => cur.filter((b) => (b._id || b.id) !== id));

    try {
      await bookingsApi.cancel(id);
      setOk("Booking cancelled.");
    } catch (e) {
      // rollback if API fails
      setItems(prev);
      setErr(e?.response?.data?.message || "Cancel failed");
    }
  }

  if (loading) return <Loading label="Loading your bookings..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--text))]">My Bookings</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Manage your upcoming bookings.
          </p>
        </div>

        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>

      {err ? <Alert type="error">{err}</Alert> : null}
      {ok ? <Alert type="success">{ok}</Alert> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((b) => {
          const id = b._id || b.id;

          return (
            <div
              key={id}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-[rgb(var(--text))] truncate">
                    {b.teamName || "Booking"}
                    {b.meetingTitle ? (
                      <span className="text-[rgb(var(--muted))]"> — {b.meetingTitle}</span>
                    ) : null}
                  </div>

                  <div className="mt-1 text-sm text-[rgb(var(--muted))]">
                    {fmtDateTime(b.startAt)} → {fmtDateTime(b.endAt)}
                  </div>

                  <div className="mt-3 inline-flex flex-wrap items-center gap-2">
                    <DurationPill label={durationLabel(b.startAt, b.endAt)} />
                    <StatusPill status={b.status || "CONFIRMED"} />
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => cancelBooking(id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {!items.length ? (
          <Card className="p-6">
            <div className="text-sm text-[rgb(var(--muted))]">No active bookings.</div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
