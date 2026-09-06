"use client";
// LaPeluqueriaCo — cliente tipado de las APIs del booking engine
import type { Artist, Service, Session } from "./domain";

export interface CatalogResponse {
  services: Service[];
  artists: Artist[];
}

export interface AvailabilityResponse {
  slots: { id: string; time: string; available: boolean }[];
  dates: string[];
  reason?: string;
}

export class ApiError extends Error {
  status: number;
  data?: Record<string, unknown>;
  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      (data.error as string) ?? data.message as string ?? "Algo se cortó en el camino.",
      res.status,
      data
    );
  }
  return data as T;
}

export function fetchCatalog() {
  return jsonFetch<CatalogResponse>("/api/catalog");
}

export function fetchAvailability(artistId: string, serviceId: string, date: string) {
  return jsonFetch<AvailabilityResponse>(
    `/api/availability?artistId=${artistId}&serviceId=${serviceId}&date=${date}`
  );
}

export interface CreateBookingInput {
  serviceId: string;
  artistId: string;
  date: string;
  time: string;
  customer: { name: string; phone: string; email?: string; notes?: string };
}

export interface CutConflict {
  error: "cut";
  message: string;
  alternatives: { date: string; time: string }[];
}

export function createBooking(input: CreateBookingInput) {
  return jsonFetch<{ session: Session }>("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function fetchSession(id: string) {
  return jsonFetch<{ session: Session }>(`/api/bookings/${encodeURIComponent(id)}`);
}

export function cancelSession(id: string) {
  return jsonFetch<{ session: Session }>(
    `/api/bookings/${encodeURIComponent(id)}/cancel`,
    { method: "POST" }
  );
}

export function rescheduleSession(id: string, date: string, time: string) {
  return jsonFetch<{ session: Session; previousId: string }>(
    `/api/bookings/${encodeURIComponent(id)}/reschedule`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time }),
    }
  );
}

/* ---------- LA CABINA (backoffice de barberos) ---------- */

export interface AgendaArtist {
  id: string;
  name: string;
  tag: string | null;
  specialty: string;
  photo: string;
  services: string[];
  bookings: {
    id: string;
    time: string;
    minutes: number;
    price: number;
    name: string;
    phone: string;
    notes: string | null;
    serviceId: string;
    serviceName: string;
    status: string;
  }[];
  blocks: { id: string; time: string; minutes: number; reason: string }[];
}

export interface WeekTotals {
  sessions: number;
  revenue: number;
  completed: number;
  cancelled: number;
}

export interface AgendaResponse {
  date: string;
  dates: string[];
  week: { current: WeekTotals; previous: WeekTotals };
  artists: AgendaArtist[];
  stats: {
    totalBookings: number;
    completed: number;
    revenue: number;
    revenueDone: number;
    bookedMinutes: number;
    capacityMinutes: number;
    totalBlocks: number;
    totalBlockMinutes: number;
  };
}

const cabinaHeaders = (code: string) => ({ "x-cabina-code": code });

export function fetchAgenda(code: string, date: string) {
  return jsonFetch<AgendaResponse>(
    `/api/admin/agenda?date=${encodeURIComponent(date)}`,
    { headers: cabinaHeaders(code) }
  );
}

export function createBlock(
  code: string,
  input: { artistId: string; date: string; time: string; minutes?: number; reason?: string }
) {
  return jsonFetch<{ block: { id: string; time: string; minutes: number; reason: string } }>(
    "/api/admin/blocks",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabinaHeaders(code) },
      body: JSON.stringify(input),
    }
  );
}

export interface ClientCard {
  name: string;
  phone: string;
  totalSessions: number;
  cancelled: number;
  spent: number;
  nextSession: {
    id: string;
    date: string;
    time: string;
    artist: string;
    service: string;
  } | null;
  history: {
    id: string;
    date: string;
    time: string;
    status: string;
    artist: string;
    service: string;
    price: number;
  }[];
}

export function searchClients(code: string, q: string) {
  return jsonFetch<{ clients: ClientCard[]; hint?: string }>(
    `/api/admin/clients?q=${encodeURIComponent(q)}`,
    { headers: cabinaHeaders(code) }
  );
}

export function deleteBlock(code: string, id: string) {
  return jsonFetch<{ ok: boolean }>(
    `/api/admin/blocks?id=${encodeURIComponent(id)}`,
    { method: "DELETE", headers: cabinaHeaders(code) }
  );
}

export function setSessionStatus(code: string, id: string, status: "completed" | "confirmed") {
  return jsonFetch<{ session: { id: string; status: string } }>("/api/admin/bookings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...cabinaHeaders(code) },
    body: JSON.stringify({ id, status }),
  });
}

/* LA LISTA — el club de los viernes, desde la cabina */

export interface ClubSignupRow {
  id: string;
  name: string;
  contact: string;
  createdAt: string; // ISO datetime
}

export interface ClubListResponse {
  list: ClubSignupRow[];
  total: number;
}

export function fetchClubList(code: string) {
  return jsonFetch<ClubListResponse>("/api/admin/club", {
    headers: cabinaHeaders(code),
  });
}

export function joinClub(name: string, contact: string) {
  return jsonFetch<{ ok: boolean; already: boolean; id?: string }>("/api/club", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, contact }),
  });
}
