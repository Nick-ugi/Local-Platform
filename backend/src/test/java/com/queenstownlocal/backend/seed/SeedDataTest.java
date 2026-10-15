package com.queenstownlocal.backend.seed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.PGConnection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

import com.queenstownlocal.backend.TestcontainersConfiguration;

/**
 * Loads seed CSV the way backend/seed/load-places.sh does: create-staging.sql, COPY, upsert-places.sql,
 * all in one transaction. Not @Transactional: each load commits on its own, as it does from the
 * script, so that updated_at (now(), the transaction's start) can move between loads.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SeedDataTest {

	private static final Path SEED_DIR = Path.of("seed");

	private static final String HEADER = "slug,name,category,subtype,description,address,latitude,longitude,"
			+ "opening_hours,phone,website,image_url,source,source_url,status\n";

	private static final String LAKESIDE = "lakeside-kitchen,Lakeside Kitchen,food,,Lakefront restaurant.,"
			+ "12 Beach Street,-45.0322,168.661,,03 000 0000,,,Business website,https://lakesidekitchen.example,public\n";

	private static final String TOILET = "beach-street-toilet,Beach Street toilet,facility,toilet,,Beach Street,"
			+ "-45.0331,168.6597,,,,,QLDC,https://qldc.example,public\n";

	@Autowired
	DataSource dataSource;

	@Autowired
	JdbcClient jdbc;

	@BeforeEach
	@AfterEach
	void clear() {
		jdbc.sql("delete from place").update();
	}

	@Test
	void theSeedFileLoads() throws Exception {
		String csv = Files.readString(SEED_DIR.resolve("places.csv"), StandardCharsets.UTF_8);
		long dataLines = csv.lines().skip(1).filter(line -> !line.isBlank()).count();

		load(csv);

		assertThat(placeCount()).isEqualTo(dataLines);
	}

	@Test
	void loadingTwiceChangesNothing() throws Exception {
		load(HEADER + LAKESIDE + TOILET);
		Map<String, OffsetDateTime> before = updatedAtBySlug();

		load(HEADER + LAKESIDE + TOILET);

		assertThat(placeCount()).isEqualTo(2);
		assertThat(updatedAtBySlug()).isEqualTo(before);
	}

	@Test
	void aChangedRowIsUpdatedInPlace() throws Exception {
		load(HEADER + LAKESIDE);
		long id = idOf("lakeside-kitchen");
		OffsetDateTime before = updatedAtBySlug().get("lakeside-kitchen");

		load(HEADER + LAKESIDE.replace("Lakeside Kitchen,", "Lakeside Kitchen & Bar,"));

		assertThat(idOf("lakeside-kitchen")).isEqualTo(id);
		assertThat(jdbc.sql("select name from place where slug = 'lakeside-kitchen'").query(String.class).single())
			.isEqualTo("Lakeside Kitchen & Bar");
		assertThat(updatedAtBySlug().get("lakeside-kitchen")).isAfter(before);
	}

	@Test
	void aRowLeftOutIsNotDeleted() throws Exception {
		load(HEADER + LAKESIDE + TOILET);

		load(HEADER + LAKESIDE);

		assertThat(updatedAtBySlug()).containsOnlyKeys("lakeside-kitchen", "beach-street-toilet");
	}

	@Test
	void aRowOutsideTheServiceAreaIsRefused() {
		String auckland = "sky-tower,Sky Tower,activity,,,Victoria Street,-36.85,174.76,,,,,Auckland,https://a.example,public\n";

		assertThatThrownBy(() -> load(HEADER + LAKESIDE + auckland)).hasMessageContaining("sky-tower");
		assertThat(placeCount()).isZero();
	}

	@Test
	void swappedCoordinatesAreRefused() {
		String swapped = LAKESIDE.replace("-45.0322,168.661", "168.66,-45.03");

		assertThatThrownBy(() -> load(HEADER + swapped)).hasMessageContaining("lakeside-kitchen");
		assertThat(placeCount()).isZero();
	}

	@Test
	void aMalformedSlugIsRefused() {
		for (String slug : List.of("Bad Slug", "-a", "a--b")) {
			String row = LAKESIDE.replace("lakeside-kitchen,", "\"" + slug + "\",");

			assertThatThrownBy(() -> load(HEADER + row)).hasMessageContaining(slug);
		}
		assertThat(placeCount()).isZero();
	}

	@Test
	void aSlugUsedTwiceIsRefused() {
		assertThatThrownBy(() -> load(HEADER + LAKESIDE + LAKESIDE)).hasMessageContaining("lakeside-kitchen");
		assertThat(placeCount()).isZero();
	}

	@Test
	void aRowWithoutASourceIsRefused() {
		String noSource = LAKESIDE.replace("https://lakesidekitchen.example,", ",");

		assertThatThrownBy(() -> load(HEADER + noSource)).isInstanceOf(SQLException.class);
		assertThat(placeCount()).isZero();
	}

	@Test
	void namesWithCommasAndApostrophesLoad() throws Exception {
		load(HEADER + LAKESIDE.replace("Lakeside Kitchen,", "\"Joe's Garage, Queenstown\","));

		assertThat(jdbc.sql("select name from place").query(String.class).single())
			.isEqualTo("Joe's Garage, Queenstown");
	}

	@Test
	void emptyCellsAreNull() throws Exception {
		load(HEADER + TOILET);

		Map<String, Object> row = jdbc.sql("select description, phone, website, image_url from place").query().singleRow();
		assertThat(row.values()).containsOnlyNulls();
	}

	/** One load, as load-places.sh runs it: all of it commits, or none of it does. */
	private void load(String csv) throws SQLException, IOException {
		try (Connection connection = dataSource.getConnection()) {
			connection.setAutoCommit(false);
			try (Statement statement = connection.createStatement()) {
				statement.execute(Files.readString(SEED_DIR.resolve("create-staging.sql")));
				connection.unwrap(PGConnection.class)
					.getCopyAPI()
					.copyIn("COPY seed_place FROM STDIN (FORMAT csv, HEADER true)", new StringReader(csv));
				statement.execute(Files.readString(SEED_DIR.resolve("upsert-places.sql")));
				connection.commit();
			}
			catch (SQLException | IOException | RuntimeException e) {
				connection.rollback();
				throw e;
			}
		}
	}

	private long placeCount() {
		return jdbc.sql("select count(*) from place").query(Long.class).single();
	}

	private long idOf(String slug) {
		return jdbc.sql("select id from place where slug = :slug").param("slug", slug).query(Long.class).single();
	}

	private Map<String, OffsetDateTime> updatedAtBySlug() {
		return jdbc.sql("select slug, updated_at from place")
			.query((rs, rowNum) -> Map.entry(rs.getString("slug"), rs.getObject("updated_at", OffsetDateTime.class)))
			.list()
			.stream()
			.collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
	}

}
