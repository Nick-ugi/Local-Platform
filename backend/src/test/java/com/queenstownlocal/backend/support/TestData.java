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

}
