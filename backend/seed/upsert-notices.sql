-- Copies seed_notice into notice, with the rules of upsert-places.sql. A notice may have no
-- location: then latitude and longitude are both empty, and so is location_name.

DO $$
DECLARE
    bad text;
BEGIN
    SELECT string_agg(coalesce(slug, '(blank)'), ', ' ORDER BY slug) INTO bad
    FROM seed_notice
    WHERE slug IS NULL OR slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Notice with a malformed slug (lowercase letters and digits joined by single hyphens): %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM (SELECT slug FROM seed_notice GROUP BY slug HAVING count(*) > 1) AS duplicated;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Notice slug used more than once: %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM seed_notice
    WHERE starts_at !~ '(Z|[+-][0-9]{2}:?[0-9]{2})$'
       OR (ends_at IS NOT NULL AND ends_at !~ '(Z|[+-][0-9]{2}:?[0-9]{2})$');
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Notice time without an offset such as +13:00: %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM seed_notice
    WHERE (latitude IS NULL) <> (longitude IS NULL);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Notice with only one of latitude and longitude: %', bad;
    END IF;

    SELECT string_agg(slug, ', ' ORDER BY slug) INTO bad
    FROM seed_notice
    WHERE latitude IS NOT NULL
      AND CASE
        WHEN latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180 THEN
            ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(168.6626, -45.0312), 4326)::geography
            ) > 50000
        ELSE true
    END;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'Notice outside the service area (more than 50 km from Queenstown): %', bad;
    END IF;
END
$$;

INSERT INTO notice (slug, title, type, summary, starts_at, ends_at, location_name, location, source_org, source_url,
                    is_official, status)
SELECT slug, title, type, summary, starts_at::timestamptz, ends_at::timestamptz, location_name,
       CASE WHEN latitude IS NULL THEN NULL
            ELSE ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography END,
       source_org, source_url, is_official::boolean, status
FROM seed_notice
ON CONFLICT (slug) DO UPDATE
SET title         = EXCLUDED.title,
    type          = EXCLUDED.type,
    summary       = EXCLUDED.summary,
    starts_at     = EXCLUDED.starts_at,
    ends_at       = EXCLUDED.ends_at,
    location_name = EXCLUDED.location_name,
    location      = EXCLUDED.location,
    source_org    = EXCLUDED.source_org,
    source_url    = EXCLUDED.source_url,
    is_official   = EXCLUDED.is_official,
    status        = EXCLUDED.status,
    updated_at    = now()
WHERE (notice.title, notice.type, notice.summary, notice.starts_at, notice.ends_at, notice.location_name,
       ST_AsBinary(notice.location), notice.source_org, notice.source_url, notice.is_official, notice.status)
      IS DISTINCT FROM
      (EXCLUDED.title, EXCLUDED.type, EXCLUDED.summary, EXCLUDED.starts_at, EXCLUDED.ends_at,
       EXCLUDED.location_name, ST_AsBinary(EXCLUDED.location), EXCLUDED.source_org, EXCLUDED.source_url,
       EXCLUDED.is_official, EXCLUDED.status);
