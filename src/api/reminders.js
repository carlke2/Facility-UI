import { bookingsApi } from "./bookings";

function generateRemindersForBookings(bookings) {
  const reminders = [];
  const now = new Date();

  bookings.forEach((b) => {
    if (b.status === "CANCELLED" || b.status === "REJECTED") return;

    const start = new Date(b.startAt);
    const end = new Date(b.endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    // 1. STARTS_20 reminder
    const time20 = new Date(start.getTime() - 20 * 60000);
    const sent20 = now >= time20;
    reminders.push({
      id: `${b.id || b._id}-starts-20`,
      type: "STARTS_20",
      status: sent20 ? "SENT" : "PENDING",
      scheduledAt: time20.toISOString(),
      sentAt: sent20 ? time20.toISOString() : null,
      bookingId: b,
    });

    // 2. JOIN_NOW reminder
    const timeJoin = start;
    const sentJoin = now >= timeJoin;
    reminders.push({
      id: `${b.id || b._id}-join-now`,
      type: "JOIN_NOW",
      status: sentJoin ? "SENT" : "PENDING",
      scheduledAt: timeJoin.toISOString(),
      sentAt: sentJoin ? timeJoin.toISOString() : null,
      bookingId: b,
    });

    // 3. ENDING_10 reminder
    const time10 = new Date(end.getTime() - 10 * 60000);
    const sent10 = now >= time10;
    reminders.push({
      id: `${b.id || b._id}-ending-10`,
      type: "ENDING_10",
      status: sent10 ? "SENT" : "PENDING",
      scheduledAt: time10.toISOString(),
      sentAt: sent10 ? time10.toISOString() : null,
      bookingId: b,
    });
  });

  return reminders.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
}

export const remindersApi = {
  async mine() {
    try {
      const bookings = await bookingsApi.mine();
      return generateRemindersForBookings(bookings);
    } catch {
      return [];
    }
  },

  async mineUpcoming() {
    try {
      const reminders = await this.mine();
      return reminders.filter((r) => r.status === "PENDING");
    } catch {
      return [];
    }
  },
};
