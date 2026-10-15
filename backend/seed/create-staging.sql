-- Receive the seed CSV files. The columns are the files', in their order. Only the coordinates
-- are typed here; everything else is checked by the upsert files and the tables themselves. Times
-- stay text so that a time without an offset can be refused by name rather than read in the
-- session's time zone. The tables live until the end of the transaction.

CREATE TEMPORARY TABLE seed_place (
    slug          text,
    name          text,
    category      text,
    subtype       text,
    description   text,
    address       text,
    latitude      double precision,
    longitude     double precision,
    opening_hours text,
    phone         text,
    website       text,
    image_url     text,
    source        text,
    source_url    text,
    status        text
) ON COMMIT DROP;

CREATE TEMPORARY TABLE seed_event (
    slug        text,
    title       text,
    description text,
    starts_at   text,
    ends_at     text,
    venue_name  text,
    address     text,
    latitude    double precision,
    longitude   double precision,
    image_url   text,
    source      text,
    source_url  text,
    status      text
) ON COMMIT DROP;

CREATE TEMPORARY TABLE seed_notice (
    slug          text,
    title         text,
    type          text,
    summary       text,
    starts_at     text,
    ends_at       text,
    location_name text,
    latitude      double precision,
    longitude     double precision,
    source_org    text,
    source_url    text,
    is_official   text,
    status        text
) ON COMMIT DROP;
