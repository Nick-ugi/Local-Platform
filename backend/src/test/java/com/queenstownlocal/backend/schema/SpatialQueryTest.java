package com.queenstownlocal.backend.schema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.TestData;

/** Runs the two location queries from docs/05-erd.md section 8 against a real PostGIS. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class SpatialQueryTest {

	private static final String PLACES_IN_BOX = """
			SELECT slug, name, category, subtype,
			       ST_Y(location::geometry) AS latitude,
			       ST_X(location::geometry) AS longitude
			FROM place
			WHERE status = 'public'
			  AND ST_Intersects(location, ST_MakeEnvelope(:west, :south, :east, :north, 4326)::geography)
			""";

	private static final String PLACES_NEAREST_FIRST = """
			SELECT slug, name, category, address, image_url,
			       ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_m
			FROM place
			WHERE status = 'public'
			ORDER BY distance_m
			""";

	@Autowired
	JdbcClient jdbc;

	// a: Queenstown centre, b: about 170 m away, c: Frankton about 5.6 km away, d: next to a but private
	@BeforeEach
	void seed() {
		TestData.insertPlace(jdbc, "a", "food", null, -45.0312, 168.6626, "public");
		TestData.insertPlace(jdbc, "b", "cafe", null, -45.0322, 168.6610, "public");
		TestData.insertPlace(jdbc, "c", "shopping", null, -45.0195, 168.7320, "public");
		TestData.insertPlace(jdbc, "d", "facility", "toilet", -45.0313, 168.6627, "private");
	}

	@Test
	void boundingBoxReturnsOnlyPublicPlacesInside() {
		assertThat(placesInBox()).extracting(row -> row.get("slug")).containsExactlyInAnyOrder("a", "b");
	}

	@Test
	void boundingBoxReturnsStoredCoordinates() {
		Map<String, Object> b = placesInBox().stream().filter(row -> row.get("slug").equals("b")).findFirst().orElseThrow();

		assertThat((Double) b.get("latitude")).isCloseTo(-45.0322, within(1e-6));
		assertThat((Double) b.get("longitude")).isCloseTo(168.6610, within(1e-6));
	}

	@Test
	void nearestFirstWithDistanceInMetres() {
		List<Map<String, Object>> rows = jdbc.sql(PLACES_NEAREST_FIRST)
			.param("lat", -45.0312)
			.param("lng", 168.6626)
			.query()
			.listOfRows();

		assertThat(rows).extracting(row -> row.get("slug")).containsExactly("a", "b", "c");
		assertThat((Double) rows.get(0).get("distance_m")).isLessThan(1.0);
		assertThat((Double) rows.get(1).get("distance_m")).isBetween(150.0, 190.0);
		assertThat((Double) rows.get(2).get("distance_m")).isBetween(5400.0, 5800.0);
	}

	private List<Map<String, Object>> placesInBox() {
		return jdbc.sql(PLACES_IN_BOX)
			.param("west", 168.65)
			.param("south", -45.04)
			.param("east", 168.67)
			.param("north", -45.02)
			.query()
			.listOfRows();
	}

}
