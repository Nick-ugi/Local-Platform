package com.queenstownlocal.backend.support;

import org.springframework.jdbc.core.simple.JdbcClient;

/** Inserts rows for integration tests. Fields the caller does not pass get fixed placeholder values. */
public final class TestData {

	private TestData() {
	}

	/** A place whose name is its slug, with the address "addr" and no description. */
	public static void insertPlace(JdbcClient jdbc, String slug, String category, String subtype, double latitude,
			double longitude, String status) {
		insertPlace(jdbc, slug, slug, category, subtype, latitude, longitude, status, "addr", null);
	}

	public static void insertPlace(JdbcClient jdbc, String slug, String name, String category, String subtype,
			double latitude, double longitude, String status, String address, String description) {
		jdbc.sql("""
				insert into place (slug, name, category, subtype, description, address, location, source, source_url,
				                   status)
				values (:slug, :name, :category, :subtype, :description, :address,
				        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
				        'test', 'https://example.com', :status)
				""")
			.param("slug", slug)
			.param("name", name)
			.param("category", category)
			.param("subtype", subtype)
			.param("description", description)
			.param("address", address)
			.param("latitude", latitude)
			.param("longitude", longitude)
			.param("status", status)
			.update();
	}

	/** A public or private event at Earnslaw Park. {@code endsAt} may be null. Times are ISO 8601 with an offset. */
	public static void insertEvent(JdbcClient jdbc, String slug, String startsAt, String endsAt, String status) {
		jdbc.sql("""
				insert into event (slug, title, starts_at, ends_at, venue_name, location, source, source_url, status)
				values (:slug, :slug, cast(:startsAt as timestamptz), cast(:endsAt as timestamptz), 'Earnslaw Park',
				        ST_SetSRID(ST_MakePoint(168.6597, -45.0331), 4326)::geography,
				        'test', 'https://example.com', :status)
				""")
			.param("slug", slug)
			.param("startsAt", startsAt)
			.param("endsAt", endsAt)
			.param("status", status)
			.update();
	}

	/**
	 * A notice of the given type. {@code endsAt} may be null; without a latitude the notice has no
	 * location. Times are ISO 8601 with an offset.
	 */
	public static void insertNotice(JdbcClient jdbc, String slug, String type, String startsAt, String endsAt,
			Double latitude, Double longitude, String status) {
		jdbc.sql("""
				insert into notice (slug, title, type, summary, starts_at, ends_at, location_name, location,
				                    source_org, source_url, is_official, status)
				values (:slug, :slug, :type, 'summary', cast(:startsAt as timestamptz), cast(:endsAt as timestamptz),
				        case when cast(:latitude as double precision) is null then null else 'here' end,
				        case when cast(:latitude as double precision) is null then null
				             else ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography end,
				        'QLDC', 'https://qldc.example', true, :status)
				""")
			.param("slug", slug)
			.param("type", type)
			.param("startsAt", startsAt)
			.param("endsAt", endsAt)
			.param("latitude", latitude)
			.param("longitude", longitude)
			.param("status", status)
			.update();
	}

}
