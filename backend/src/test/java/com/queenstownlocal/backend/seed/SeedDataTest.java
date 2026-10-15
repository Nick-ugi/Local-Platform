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
import org.postgresql.copy.CopyManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

import com.queenstownlocal.backend.TestcontainersConfiguration;

/**
 * Loads seed CSV the way backend/seed/load-seed.sh does: create-staging.sql, a COPY per file, then the
 * upsert files, all in one transaction. Not @Transactional: each load commits on its own, as it does from the
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

	private static final String EVENT_HEADER = "slug,title,description,starts_at,ends_at,venue_name,address,latitude,"
			+ "longitude,image_url,source,source_url,status\n";

	private static final String MARKET = "night-market,Night Market,Food stalls.,2026-10-24T17:00:00+13:00,"
			+ "2026-10-24T21:00:00+13:00,Earnslaw Park,,-45.0331,168.6597,,Organiser,https://market.example,public\n";

	private static final String NOTICE_HEADER = "slug,title,type,summary,starts_at,ends_at,location_name,latitude,"
			+ "longitude,source_org,source_url,is_official,status\n";

	private static final String WORKS = "shotover-street-works,Shotover Street works,road-work,Expect delays.,"
			+ "2026-10-05T18:00:00+13:00,2026-10-20T18:00:00+13:00,Shotover Street,-45.0312,168.6626,QLDC,"
			+ "https://qldc.example/works,true,public\n";

	private static final String LIBRARY = "library-hours,Library hours,public-notice,New hours.,"
			+ "2026-10-12T09:00:00+13:00,,,,,QLDC,https://qldc.example/library,true,public\n";

	@BeforeEach
	@AfterEach
	void clear() {
		jdbc.sql("delete from place").update();
		jdbc.sql("delete from event").update();
		jdbc.sql("delete from notice").update();
	}

	@Test
	void theSeedFilesLoad() throws Exception {
		String places = Files.readString(SEED_DIR.resolve("places.csv"), StandardCharsets.UTF_8);
		String events = Files.readString(SEED_DIR.resolve("events.csv"), StandardCharsets.UTF_8);
		String notices = Files.readString(SEED_DIR.resolve("notices.csv"), StandardCharsets.UTF_8);

		load(places, events, notices);

		assertThat(placeCount()).isEqualTo(dataLines(places));
		assertThat(count("event")).isEqualTo(dataLines(events));
		assertThat(count("notice")).isEqualTo(dataLines(notices));
	}

	@Test
	void eventsAndNoticesLoadAndLoadingTwiceChangesNothing() throws Exception {
		load(HEADER, EVENT_HEADER + MARKET, NOTICE_HEADER + WORKS + LIBRARY);
		Map<String, Object> before = jdbc.sql("""
				select (select max(updated_at) from event) as events, (select max(updated_at) from notice) as notices
				""").query().singleRow();

		load(HEADER, EVENT_HEADER + MARKET, NOTICE_HEADER + WORKS + LIBRARY);

		assertThat(count("event")).isEqualTo(1);
		assertThat(count("notice")).isEqualTo(2);
		assertThat(jdbc.sql("""
				select (select max(updated_at) from event) as events, (select max(updated_at) from notice) as notices
				""").query().singleRow()).isEqualTo(before);
		assertThat(jdbc.sql("select starts_at from event").query(OffsetDateTime.class).single().toInstant())
			.hasToString("2026-10-24T04:00:00Z");
	}

	@Test
	void aNoticeWithoutALocationLoads() throws Exception {
		load(HEADER, EVENT_HEADER, NOTICE_HEADER + LIBRARY);

		Map<String, Object> row = jdbc.sql("select location, location_name, is_official, ends_at from notice")
			.query()
			.singleRow();
		assertThat(row).containsEntry("location", null)
			.containsEntry("location_name", null)
			.containsEntry("is_official", true)
			.containsEntry("ends_at", null);
	}

	@Test
	void aChangedEventIsUpdatedInPlace() throws Exception {
		load(HEADER, EVENT_HEADER + MARKET, NOTICE_HEADER);
		long id = jdbc.sql("select id from event").query(Long.class).single();

		load(HEADER, EVENT_HEADER + MARKET.replace("Food stalls.", "Food stalls and music."), NOTICE_HEADER);

		assertThat(jdbc.sql("select id from event").query(Long.class).single()).isEqualTo(id);
		assertThat(jdbc.sql("select description from event").query(String.class).single())
			.isEqualTo("Food stalls and music.");
	}

	@Test
	void aTimeWithoutAnOffsetIsRefused() {
		String local = MARKET.replace("2026-10-24T17:00:00+13:00", "2026-10-24T17:00:00");

		assertThatThrownBy(() -> load(HEADER, EVENT_HEADER + local, NOTICE_HEADER)).hasMessageContaining("night-market");
		assertThat(count("event")).isZero();
	}

	@Test
	void aNoticeWithHalfALocationIsRefused() {
		String half = WORKS.replace("-45.0312,168.6626", "-45.0312,");

		assertThatThrownBy(() -> load(HEADER, EVENT_HEADER, NOTICE_HEADER + half))
			.hasMessageContaining("shotover-street-works");
	}

	@Test
	void anEventOrNoticeOutsideTheServiceAreaIsRefused() {
		assertThatThrownBy(() -> load(HEADER, EVENT_HEADER + MARKET.replace("-45.0331,168.6597", "-36.85,174.76"),
				NOTICE_HEADER))
			.hasMessageContaining("night-market");
		assertThatThrownBy(() -> load(HEADER, EVENT_HEADER,
				NOTICE_HEADER + WORKS.replace("-45.0312,168.6626", "-36.85,174.76")))
			.hasMessageContaining("shotover-street-works");
	}

	@Test
	void anUnknownNoticeTypeIsRefused() {
		assertThatThrownBy(() -> load(HEADER, EVENT_HEADER, NOTICE_HEADER + WORKS.replace("road-work", "fire")))
			.isInstanceOf(SQLException.class);
	}

	@Test
	void aFailingFileChangesNoOtherFile() {
		String badNotice = WORKS.replace("shotover-street-works", "Bad Slug");

		assertThatThrownBy(() -> load(HEADER + TOILET, EVENT_HEADER + MARKET, NOTICE_HEADER + badNotice))
			.hasMessageContaining("Bad Slug");
		assertThat(placeCount()).isZero();
		assertThat(count("event")).isZero();
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

	/** A load of places only, with empty event and notice files. */
	private void load(String places) throws SQLException, IOException {
		load(places, EVENT_HEADER, NOTICE_HEADER);
	}

	/** One load, as load-seed.sh runs it: all of it commits, or none of it does. */
	private void load(String places, String events, String notices) throws SQLException, IOException {
		try (Connection connection = dataSource.getConnection()) {
			connection.setAutoCommit(false);
			try (Statement statement = connection.createStatement()) {
				statement.execute(Files.readString(SEED_DIR.resolve("create-staging.sql")));
				CopyManager copy = connection.unwrap(PGConnection.class).getCopyAPI();
				copy.copyIn("COPY seed_place FROM STDIN (FORMAT csv, HEADER true)", new StringReader(places));
				copy.copyIn("COPY seed_event FROM STDIN (FORMAT csv, HEADER true)", new StringReader(events));
				copy.copyIn("COPY seed_notice FROM STDIN (FORMAT csv, HEADER true)", new StringReader(notices));
				for (String upsert : List.of("upsert-places.sql", "upsert-events.sql", "upsert-notices.sql")) {
					statement.execute(Files.readString(SEED_DIR.resolve(upsert)));
				}
				connection.commit();
			}
			catch (SQLException | IOException | RuntimeException e) {
				connection.rollback();
				throw e;
			}
		}
	}

	private long placeCount() {
		return count("place");
	}

	private long count(String table) {
		return jdbc.sql("select count(*) from " + table).query(Long.class).single();
	}

	private static long dataLines(String csv) {
		return csv.lines().skip(1).filter(line -> !line.isBlank()).count();
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
