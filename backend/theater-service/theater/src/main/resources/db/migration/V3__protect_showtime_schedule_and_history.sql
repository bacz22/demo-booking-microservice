-- Prevent concurrent requests from creating overlapping showtimes and
-- protect historical showtime data from parent deletes.

CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER TABLE showtimes
    ADD CONSTRAINT ex_showtimes_auditorium_time_overlap
    EXCLUDE USING gist (
        auditorium_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
    WHERE (status <> 'CANCELLED');

ALTER TABLE showtimes
    DROP CONSTRAINT showtimes_auditorium_id_fkey,
    ADD CONSTRAINT showtimes_auditorium_id_fkey
        FOREIGN KEY (auditorium_id) REFERENCES auditoriums(id) ON DELETE RESTRICT;

ALTER TABLE auditoriums
    DROP CONSTRAINT auditoriums_theater_id_fkey,
    ADD CONSTRAINT auditoriums_theater_id_fkey
        FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE RESTRICT;
