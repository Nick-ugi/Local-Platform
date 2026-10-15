-- Copies seed_place (create-staging.sql) into place. Runs in the same transaction as the COPY, so
-- a load either changes everything or nothing.
--
-- 1. Rows the place table's constraints cannot catch are refused here, naming their slugs.
-- 2. A slug already in place updates that row, and only when a value differs: updated_at is the
--    "Updated" date visitors see, so loading the same file again must not move it.
-- 3. Rows that are not in the file are left alone. A place is taken down with status 'private'.

DO $$
DECLARE
    bad text;
BEGIN
    SELECT string_agg(coalesce(slug, '(blank)'), ', ' ORDER BY slug) INTO bad
    FROM seed_place
    WHERE slug IS NULL OR slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Malformed slug (lowercase letters and digits joined by single hyphens): %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM (SELECT slug FROM seed_place GROUP BY slug HAVING count(*) > 1) AS duplicated;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Slug used more than once: %', bad;
    END IF;

    -- 50 km from the centre of Queenstown (shared/src/geo.ts SERVICE_CENTER, SERVICE_RADIUS_KM).
    -- Coordinates out of range, such as latitude and longitude swapped, are refused the same way.
    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM seed_place
    WHERE CASE
        WHEN latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180 THEN
            ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(168.6626, -45.0312), 4326)::geography
            ) > 50000
        ELSE true
    END;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Outside the service area (more than 50 km from Queenstown): %', bad;
    END IF;
END
$$;

INSERT INTO place (slug, name, category, subtype, description, address, location, opening_hours, phone, website,
                   image_url, source, source_url, status)
SELECT slug, name, category, subtype, description, address,
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
       opening_hours, phone, website, image_url, source, source_url, status
FROM seed_place
ON CONFLICT (slug) DO UPDATE
SET name          = EXCLUDED.name,
    category      = EXCLUDED.category,
    subtype       = EXCLUDED.subtype,
    description   = EXCLUDED.description,
    address       = EXCLUDED.address,
    location      = EXCLUDED.location,
    opening_hours = EXCLUDED.opening_hours,
    phone         = EXCLUDED.phone,
    website       = EXCLUDED.website,
    image_url     = EXCLUDED.image_url,
    source        = EXCLUDED.source,
    source_url    = EXCLUDED.source_url,
    status        = EXCLUDED.status,
    updated_at    = now()
WHERE (place.name, place.category, place.subtype, place.description, place.address, ST_AsBinary(place.location),
       place.opening_hours, place.phone, place.website, place.image_url, place.source, place.source_url,
       place.status)
      IS DISTINCT FROM
      (EXCLUDED.name, EXCLUDED.category, EXCLUDED.subtype, EXCLUDED.description, EXCLUDED.address,
       ST_AsBinary(EXCLUDED.location), EXCLUDED.opening_hours, EXCLUDED.phone, EXCLUDED.website,
       EXCLUDED.image_url, EXCLUDED.source, EXCLUDED.source_url, EXCLUDED.status);
