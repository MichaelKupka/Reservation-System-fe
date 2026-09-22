export type Role = "USER" | "MANAGER" | "ADMIN";
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  cinema_ids: string[];
}
export interface Session {
  access_token: string;
  expires_at: string;
  user: User;
}
export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
}
export interface Cinema {
  id: string;
  name: string;
  address: string;
}
export interface Movie {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  age_rating: number;
  is_active: boolean;
}
export interface Auditorium {
  id: string;
  cinema_id: string;
  name: string;
  seat_count: number;
}
export interface Screening {
  id: string;
  movie_id: string;
  movie_title: string;
  auditorium_id: string;
  auditorium_name: string;
  cinema_id: string;
  cinema_name: string;
  starts_at: string;
  ends_at: string;
  sales_close_at: string;
  state: "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";
  price_minor: number;
  currency: string;
}
export interface Seat {
  id: string;
  seat_id: string;
  seat_label: string;
  row_number: number;
  seat_number: number;
  price_minor: number;
  available: boolean;
}
export interface Availability {
  screening_id: string;
  currency: string;
  sales_open: boolean;
  sales_close_at: string;
  seats: Seat[];
}
export interface AuditRecord {
  entity: "user" | "manager_assignment" | "cinema" | "auditorium";
  record_id: string;
  label: string;
  created_at: string;
  created_by: string | null;
  created_by_email: string | null;
  updated_at: string;
  updated_by: string | null;
  updated_by_email: string | null;
}
export interface AuditPage {
  items: AuditRecord[];
  limit: number;
  offset: number;
}
export interface ScreeningSeatState {
  id: string;
  seat_label: string;
  bookable: boolean;
}
export interface ScreeningOccupancy {
  seats_total: number;
  withdrawn: number;
  held: number;
  confirmed: number;
  available: number;
}
export interface StaffReservation {
  id: string;
  state: "HELD" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  customer_email: string;
  customer_name: string;
  seat_labels: string[];
  total_minor: number;
  currency: string;
  created_at: string;
  expires_at: string;
}
export interface ScreeningReservationPage {
  occupancy: ScreeningOccupancy;
  items: StaffReservation[];
  limit: number;
  offset: number;
}
export interface Reservation {
  id: string;
  user_id: string | null;
  screening_id: string;
  starts_at: string;
  ends_at: string;
  state: "HELD" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  total_minor: number;
  currency: string;
  items: {
    screening_seat_id: string;
    seat_label: string;
    unit_price_minor: number;
    released_at: string | null;
  }[];
}
export interface GuestReservation {
  reservation: Reservation;
  guest_token: string;
  token_type: string;
  guest_token_expires_at: string;
}
export interface Ticket {
  id: string;
  reservation_id: string;
  screening_seat_id: string;
  code: string;
  status: "VALID" | "USED" | "VOID";
  created_at: string;
  used_at: string | null;
  used_by: string | null;
}
export interface Payment {
  id: string;
  reservation_id: string;
  amount_minor: number;
  currency: string;
  status: "SUCCEEDED" | "FAILED";
  provider: string;
  created_at: string;
}
export interface Checkout {
  payment: Payment;
  reservation: Reservation;
  tickets: Ticket[];
}
export interface Notification {
  id: string;
  reservation_id: string;
  kind: "RESERVATION_CONFIRMED" | "SCREENING_CANCELLED";
  status: "PENDING" | "DELIVERED";
  created_at: string;
  delivered_at: string | null;
}
