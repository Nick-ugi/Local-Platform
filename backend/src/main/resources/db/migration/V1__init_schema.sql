CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE place (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug          varchar(120) NOT NULL,
    name          varchar(120) NOT NULL,
    category      varchar(20)  NOT NULL,
    subtype       varchar(20),
    description   text,
    address       varchar(255) NOT NULL,
    location      geography(Point, 4326) NOT NULL,
    opening_hours varchar(255),
    phone         varchar(30),
    website       varchar(500),
    image_url     varchar(500),
    source        varchar(120) NOT NULL,
    source_url    varchar(500) NOT NULL,
    status        varchar(10)  NOT NULL DEFAULT 'private',
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_place_slug UNIQUE (slug),
    CONSTRAINT ck_place_category CHECK (category IN ('food', 'cafe', 'bar', 'activity', 'shopping', 'facility')),
    CONSTRAINT ck_place_subtype CHECK (
        (category = 'facility' AND subtype IS NOT NULL
            AND subtype IN ('toilet', 'parking', 'information', 'library', 'medical', 'other'))
        OR (category <> 'facility' AND subtype IS NULL)
    ),
    CONSTRAINT ck_place_status CHECK (status IN ('public', 'private'))
);

CREATE INDEX ix_place_location ON place USING gist (location);
CREATE INDEX ix_place_status_category ON place (status, category);

CREATE TABLE event (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug        varchar(160) NOT NULL,
    title       varchar(160) NOT NULL,
    description text,
    starts_at   timestamptz  NOT NULL,
    ends_at     timestamptz,
    venue_name  varchar(120) NOT NULL,
    address     varchar(255),
    location    geography(Point, 4326) NOT NULL,
    image_url   varchar(500),
    source      varchar(120) NOT NULL,
    source_url  varchar(500) NOT NULL,
    status      varchar(10)  NOT NULL DEFAULT 'private',
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_slug UNIQUE (slug),
    CONSTRAINT ck_event_period CHECK (ends_at IS NULL OR ends_at >= starts_at),
    CONSTRAINT ck_event_status CHECK (status IN ('public', 'private'))
);

CREATE INDEX ix_event_location ON event USING gist (location);
CREATE INDEX ix_event_starts_at ON event (starts_at);

CREATE TABLE notice (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug          varchar(160) NOT NULL,
    title         varchar(160) NOT NULL,
    type          varchar(20)  NOT NULL,
    summary       text         NOT NULL,
    starts_at     timestamptz  NOT NULL,
    ends_at       timestamptz,
    location_name varchar(255),
    location      geography(Point, 4326),
    source_org    varchar(120) NOT NULL,
    source_url    varchar(500) NOT NULL,
    is_official   boolean      NOT NULL DEFAULT false,
    status        varchar(10)  NOT NULL DEFAULT 'private',
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_notice_slug UNIQUE (slug),
    CONSTRAINT ck_notice_type CHECK (type IN ('road-work', 'road-closure', 'public-notice', 'emergency')),
    CONSTRAINT ck_notice_period CHECK (ends_at IS NULL OR ends_at >= starts_at),
    CONSTRAINT ck_notice_status CHECK (status IN ('public', 'private'))
);

CREATE INDEX ix_notice_location ON notice USING gist (location);
CREATE INDEX ix_notice_starts_at ON notice (starts_at DESC);

CREATE TABLE app_user (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,
    role          varchar(10)  NOT NULL DEFAULT 'user',
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_app_user_role CHECK (role IN ('user', 'admin'))
);

CREATE UNIQUE INDEX uq_app_user_email ON app_user (lower(email));

CREATE TABLE refresh_token (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    token_hash varchar(64) NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_refresh_token_user ON refresh_token (user_id);

CREATE TABLE favorite (
    user_id    bigint      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    place_id   bigint      NOT NULL REFERENCES place (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_favorite PRIMARY KEY (user_id, place_id)
);

CREATE INDEX ix_favorite_place ON favorite (place_id);
