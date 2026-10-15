-- Receives backend/seed/places.csv. The columns are the CSV's, in its order. Only the coordinates
-- are typed here; everything else is checked by upsert-places.sql and the place table itself.
-- The table lives until the end of the transaction, so a load leaves nothing behind.
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
