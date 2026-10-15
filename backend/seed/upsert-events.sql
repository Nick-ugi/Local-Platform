-- Copies seed_event into event, with the rules of upsert-places.sql: refuse what the table's
-- constraints cannot catch, update a row only when a value differs, keep rows the file leaves out.

DO $$
DECLARE
    bad text;
BEGIN
    SELECT string_agg(coalesce(slug, '(blank)'), ', ' ORDER BY slug) INTO bad
    FROM seed_event
    WHERE slug IS NULL OR slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Event with a malformed slug (lowercase letters and digits joined by single hyphens): %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM (SELECT slug FROM seed_event GROUP BY slug HAVING count(*) > 1) AS duplicated;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Event slug used more than once: %', bad;
    END IF;

    -- "2026-10-24T17:00:00+13:00" or "...Z". Without an offset the time would be read as UTC.
    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM seed_event
    WHERE starts_at !~ '(Z|[+-][0-9]{2}:?[0-9]{2})$'
       OR (ends_at IS NOT NULL AND ends_at !~ '(Z|[+-][0-9]{2}:?[0-9]{2})$');
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Event time without an offset such as +13:00: %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM seed_event
    WHERE CASE
        WHEN latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180 THEN
            ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(168.6626, -45.0312), 4326)::geography
            ) > 50000
        ELSE true
    END;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Event outside the service area (more than 50 km from Queenstown): %', bad;
    END IF;
END
$$;

INSERT INTO event (slug, title, description, starts_at, ends_at, venue_name, address, location, image_url, source,
                   source_url, status)
SELECT slug, title, description, starts_at::timestamptz, ends_at::timestamptz, venue_name, address,
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
       image_url, source, source_url, status
FROM seed_event
ON CONFLICT (slug) DO UPDATE
SET title       = EXCLUDED.title,
    description = EXCLUDED.description,
    starts_at   = EXCLUDED.starts_at,
    ends_at     = EXCLUDED.ends_at,
    venue_name  = EXCLUDED.venue_name,
    address     = EXCLUDED.address,
    location    = EXCLUDED.location,
    image_url   = EXCLUDED.image_url,
    source      = EXCLUDED.source,
    source_url  = EXCLUDED.source_url,
    status      = EXCLUDED.status,
    updated_at  = now()
WHERE (event.title, event.description, event.starts_at, event.ends_at, event.venue_name, event.address,
       ST_AsBinary(event.location), event.image_url, event.source, event.source_url, event.status)
      IS DISTINCT FROM
      (EXCLUDED.title, EXCLUDED.description, EXCLUDED.starts_at, EXCLUDED.ends_at, EXCLUDED.venue_name,
       EXCLUDED.address, ST_AsBinary(EXCLUDED.location), EXCLUDED.image_url, EXCLUDED.source, EXCLUDED.source_url,
       EXCLUDED.status);
