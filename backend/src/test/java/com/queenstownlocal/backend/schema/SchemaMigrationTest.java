package com.queenstownlocal.backend.schema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.TestData;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class SchemaMigrationTest {

	@Autowired
	JdbcClient jdbc;

	@Autowired
	Flyway flyway;

	@Test
	void createsTheSixTables() {
		List<String> tables = jdbc.sql("""
				select table_name from information_schema.tables
				where table_schema = 'public'
				  and table_name in ('place', 'event', 'notice', 'app_user', 'favorite', 'refresh_token')
				order by table_name
				""").query(String.class).list();

		assertThat(tables).containsExactly("app_user", "event", "favorite", "notice", "place", "refresh_token");
	}

	@Test
	void locationColumnsAreGeography() {
		List<String> tables = jdbc.sql("""
				select table_name from information_schema.columns
				where table_schema = 'public' and column_name = 'location' and udt_name = 'geography'
				order by table_name
				""").query(String.class).list();

		assertThat(tables).containsExactly("event", "notice", "place");
	}

	@Test
	void migrationRunsOnceAndIsRestartSafe() {
		assertThat(flyway.info().applied()).hasSize(1);
		assertThat(flyway.migrate().migrationsExecuted).isZero();
	}

	@Test
	void rejectsFacilityWithoutSubtype() {
		assertThatThrownBy(() -> TestData.insertPlace(jdbc, "f1", "facility", null, -45.0312, 168.6626, "public"))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void rejectsSubtypeOnNonFacility() {
		assertThatThrownBy(() -> TestData.insertPlace(jdbc, "f2", "food", "toilet", -45.0312, 168.6626, "public"))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void rejectsSameEmailInAnotherCase() {
		insertUser("a@example.com");

		assertThatThrownBy(() -> insertUser("A@Example.com")).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void rejectsEventEndingBeforeItStarts() {
		assertThatThrownBy(() -> jdbc.sql("""
				insert into event (slug, title, starts_at, ends_at, venue_name, location, source, source_url)
				values ('e-bad', 'Bad', timestamptz '2026-10-09T05:00:00Z', timestamptz '2026-10-08T05:00:00Z', 'Park',
				        ST_SetSRID(ST_MakePoint(168.6626, -45.0312), 4326)::geography, 'test', 'https://example.com')
				""").update()).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void acceptsNoticeWithoutLocation() {
		int rows = jdbc.sql("""
				insert into notice (slug, title, type, summary, starts_at, source_org, source_url)
				values ('n-noloc', 'No location', 'public-notice', 'Summary', timestamptz '2026-10-01T00:00:00Z',
				        'QLDC', 'https://example.com')
				""").update();

		assertThat(rows).isEqualTo(1);
	}

	private void insertUser(String email) {
		jdbc.sql("insert into app_user (email, password_hash) values (:email, 'hash')").param("email", email).update();
	}

}
