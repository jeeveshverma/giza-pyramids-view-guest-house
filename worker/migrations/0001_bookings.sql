-- One row per booking. kind 'block' is the owner closing rooms (repairs, a booking taken elsewhere
-- without guest details); it holds rooms the same way a guest booking does.
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'guest' CHECK (kind IN ('guest', 'block')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'website',
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  phone_digits TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  arrival TEXT NOT NULL DEFAULT '',
  pickup INTEGER NOT NULL DEFAULT 0,
  flight TEXT NOT NULL DEFAULT '',
  requests TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  total_usd INTEGER,
  note TEXT NOT NULL DEFAULT '',
  cancelled_by TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX bookings_dates ON bookings (check_in, check_out);
CREATE INDEX bookings_created ON bookings (created_at);

-- What was booked, with the price a night at the time (null = on request).
CREATE TABLE booking_rooms (
  booking_id INTEGER NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price_usd INTEGER,
  PRIMARY KEY (booking_id, room_id)
);

-- The rooms a live (pending or confirmed) booking holds, one row per room type per night.
-- Cancelling deletes the rows, which is what frees the rooms.
CREATE TABLE booking_nights (
  booking_id INTEGER NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  night TEXT NOT NULL,
  qty INTEGER NOT NULL,
  PRIMARY KEY (booking_id, room_id, night)
);
CREATE INDEX nights_by_night ON booking_nights (night, room_id);

-- Small cached values: the site's room counts and prices, and dashboard sign-ins already checked.
CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT NOT NULL, at INTEGER NOT NULL);
