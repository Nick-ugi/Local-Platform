package com.queenstownlocal.backend.support;

import org.springframework.jdbc.core.simple.JdbcClient;

/** Inserts rows for integration tests. Fields the caller does not pass get fixed placeholder values. */
public final class TestData {

	private TestData() {
	}

	public static void insertPlace(JdbcClient jdbc, String slug, String category, String subtype, double latitude,
			double longitude, String status) {
		jdbc.sql("""
				insert into place (slug, name, category, subtype, address, location, source, source_url, status)
				values (:slug, :slug, :category, :subtype, 'addr',
				        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
				        'test', 'https://example.com', :status)
				""")
			.param("slug", slug)
			.param("category", category)
			.param("subtype", subtype)
			.param("latitude", latitude)
			.param("longitude", longitude)
			.param("status", status)
			.update();
	}

}
