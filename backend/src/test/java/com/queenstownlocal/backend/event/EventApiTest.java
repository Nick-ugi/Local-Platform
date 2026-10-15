package com.queenstownlocal.backend.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;
import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.ClockConfiguration;
import com.queenstownlocal.backend.support.MutableClock;
import com.queenstownlocal.backend.support.TestData;

/**
 * GET /events and GET /events/{slug}. Unless a test sets the clock itself, it is Wednesday
 * 14 October 2026, 10:00 in Queenstown (NZDT, UTC+13).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class EventApiTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	@BeforeEach
	void wednesdayMorning() {
		this.clock.set(ClockConfiguration.WEDNESDAY_MORNING);
	}

	@Test
	void listsEventsThatAreOnOrToComeEarliestFirst() throws Exception {
		TestData.insertEvent(jdbc, "later", "2026-10-20T18:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "ongoing", "2026-10-13T09:00:00+13:00", "2026-10-15T17:00:00+13:00", "public");
		TestData.insertEvent(jdbc, "over", "2026-10-13T09:00:00+13:00", "2026-10-14T09:59:00+13:00", "public");
		TestData.insertEvent(jdbc, "hidden", "2026-10-16T09:00:00+13:00", null, "private");
		TestData.insertEvent(jdbc, "tomorrow", "2026-10-15T09:00:00+13:00", null, "public");

		assertThat(slugs("/api/v1/events")).containsExactly("ongoing", "tomorrow", "later");
	}

	@Test
	void itemHasExactlyTheListFields() throws Exception {
		TestData.insertEvent(jdbc, "market", "2026-10-16T17:00:00+13:00", "2026-10-16T21:00:00+13:00", "public");

		Map<String, Object> item = JsonPath.parse(body("/api/v1/events")).read("$.items[0]");

		assertThat(item.keySet()).containsExactlyInAnyOrder("slug", "title", "startsAt", "endsAt", "venueName",
				"imageUrl", "latitude", "longitude");
		assertThat(item).containsEntry("startsAt", "2026-10-16T04:00:00Z")
			.containsEntry("endsAt", "2026-10-16T08:00:00Z")
			.containsEntry("venueName", "Earnslaw Park");
	}

	@Test
	void anEventWithoutAnEndLastsUntilTheEndOfItsDay() throws Exception {
		TestData.insertEvent(jdbc, "today", "2026-10-14T08:00:00+13:00", null, "public");

		this.clock.set(Instant.parse("2026-10-14T23:59:59+13:00"));
		assertThat(slugs("/api/v1/events")).containsExactly("today");

		this.clock.set(Instant.parse("2026-10-15T00:00:01+13:00"));
		assertThat(slugs("/api/v1/events")).isEmpty();
	}

	@Test
	void todayIsTheNewZealandDay() throws Exception {
		TestData.insertEvent(jdbc, "this-evening", "2026-10-14T19:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "tomorrow-early", "2026-10-15T00:30:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "all-week", "2026-10-12T09:00:00+13:00", "2026-10-18T17:00:00+13:00", "public");

		assertThat(slugs("/api/v1/events?when=today")).containsExactly("all-week", "this-evening");
	}

	@Test
	void weekIsMondayToSunday() throws Exception {
		TestData.insertEvent(jdbc, "sunday-night", "2026-10-18T23:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "next-monday", "2026-10-19T00:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "from-last-week", "2026-10-10T09:00:00+13:00", "2026-10-14T12:00:00+13:00",
				"public");

		assertThat(slugs("/api/v1/events?when=week")).containsExactly("from-last-week", "sunday-night");
	}

	@Test
	void monthRunsToTheLastDay() throws Exception {
		TestData.insertEvent(jdbc, "halloween", "2026-10-31T20:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "november", "2026-11-01T00:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "into-november", "2026-10-30T09:00:00+13:00", "2026-11-02T17:00:00+13:00",
				"public");

		assertThat(slugs("/api/v1/events?when=month")).containsExactly("into-november", "halloween");
	}

	@Test
	void todayOnTheDayDaylightSavingEnds() throws Exception {
		// Sunday 5 April 2026 is 25 hours long: 00:00 is UTC+13, 23:30 is UTC+12.
		this.clock.set(Instant.parse("2026-04-05T12:00:00+12:00"));
		TestData.insertEvent(jdbc, "late", "2026-04-05T23:30:00+12:00", null, "public");
		TestData.insertEvent(jdbc, "next-day", "2026-04-06T00:00:00+12:00", null, "public");

		assertThat(slugs("/api/v1/events?when=today")).containsExactly("late");
	}

	@Test
	void anEventWithoutAnEndOnTheDayDaylightSavingStarts() throws Exception {
		// Sunday 27 September 2026 is 23 hours long and ends at 00:00 NZDT (UTC+13).
		TestData.insertEvent(jdbc, "spring", "2026-09-27T09:00:00+12:00", null, "public");

		this.clock.set(Instant.parse("2026-09-27T23:59:00+13:00"));
		assertThat(slugs("/api/v1/events")).containsExactly("spring");

		this.clock.set(Instant.parse("2026-09-28T00:01:00+13:00"));
		assertThat(slugs("/api/v1/events")).isEmpty();
	}

	@Test
	void pagesKeepTheirOrder() throws Exception {
		for (int i = 0; i < 3; i++) {
			TestData.insertEvent(jdbc, "same-" + i, "2026-10-20T18:00:00+13:00", null, "public");
		}

		mvc.perform(get("/api/v1/events?size=2&page=2"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.items[0].slug").value("same-2"))
			.andExpect(jsonPath("$.page").value(2))
			.andExpect(jsonPath("$.size").value(2))
			.andExpect(jsonPath("$.total").value(3));
	}

	@Test
	void unknownWhenIsRejected() throws Exception {
		mvc.perform(get("/api/v1/events?when=year"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.errors[0].field").value("when"));
	}

	@Test
	void detailHasExactlyTheDocumentedFields() throws Exception {
		TestData.insertEvent(jdbc, "market", "2026-10-16T17:00:00+13:00", "2026-10-16T21:00:00+13:00", "public");

		Map<String, Object> event = JsonPath.parse(body("/api/v1/events/market")).read("$");

		assertThat(event.keySet()).containsExactlyInAnyOrder("slug", "title", "startsAt", "endsAt", "venueName",
				"imageUrl", "latitude", "longitude", "description", "address", "source", "sourceUrl", "updatedAt",
				"ended");
		assertThat(event).containsEntry("ended", false).containsEntry("source", "test");
	}

	@Test
	void anEndedEventStillHasItsPage() throws Exception {
		TestData.insertEvent(jdbc, "over", "2026-10-13T09:00:00+13:00", "2026-10-13T17:00:00+13:00", "public");

		mvc.perform(get("/api/v1/events/over")).andExpect(status().isOk()).andExpect(jsonPath("$.ended").value(true));
	}

	@Test
	void aPrivateOrMissingEventIsNotFound() throws Exception {
		TestData.insertEvent(jdbc, "hidden", "2026-10-16T09:00:00+13:00", null, "private");

		mvc.perform(get("/api/v1/events/hidden")).andExpect(status().isNotFound());
		mvc.perform(get("/api/v1/events/nope"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	private String body(String url) throws Exception {
		return mvc.perform(get(url))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
	}

	private List<String> slugs(String url) throws Exception {
		return JsonPath.parse(body(url)).read("$.items[*].slug");
	}

}
