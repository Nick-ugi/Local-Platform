package com.queenstownlocal.backend.notice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
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

/** GET /notices and GET /notices/{slug}. It is Wednesday 14 October 2026, 10:00 in Queenstown. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class NoticeApiTest {

	private static final double LAT = -45.0312;

	private static final double LNG = 168.6626;

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
	void listsNoticesThatHaveNotEndedLatestFirst() throws Exception {
		TestData.insertNotice(jdbc, "older", "road-work", "2026-10-01T09:00:00+13:00", null, LAT, LNG, "public");
		TestData.insertNotice(jdbc, "newer", "public-notice", "2026-10-10T09:00:00+13:00", "2026-10-20T17:00:00+13:00",
				LAT, LNG, "public");
		TestData.insertNotice(jdbc, "upcoming", "road-closure", "2026-10-17T08:00:00+13:00",
				"2026-10-17T18:00:00+13:00", LAT, LNG, "public");
		TestData.insertNotice(jdbc, "ended", "road-work", "2026-10-01T09:00:00+13:00", "2026-10-14T09:00:00+13:00",
				LAT, LNG, "public");
		TestData.insertNotice(jdbc, "hidden", "emergency", "2026-10-12T09:00:00+13:00", null, LAT, LNG, "private");

		assertThat(slugs("/api/v1/notices")).containsExactly("upcoming", "newer", "older");
	}

	@Test
	void itemHasExactlyTheListFields() throws Exception {
		TestData.insertNotice(jdbc, "works", "road-work", "2026-10-05T18:00:00+13:00", "2026-10-20T18:00:00+13:00",
				LAT, LNG, "public");

		Map<String, Object> item = JsonPath.parse(body("/api/v1/notices")).read("$.items[0]");

		assertThat(item.keySet()).containsExactlyInAnyOrder("slug", "title", "type", "isOfficial", "startsAt",
				"endsAt");
		assertThat(item).containsEntry("type", "road-work")
			.containsEntry("isOfficial", true)
			.containsEntry("startsAt", "2026-10-05T05:00:00Z");
	}

	@Test
	void typeNarrowsTheList() throws Exception {
		TestData.insertNotice(jdbc, "works", "road-work", "2026-10-05T09:00:00+13:00", null, LAT, LNG, "public");
		TestData.insertNotice(jdbc, "closed", "road-closure", "2026-10-06T09:00:00+13:00", null, LAT, LNG, "public");

		assertThat(slugs("/api/v1/notices?type=road-closure")).containsExactly("closed");
	}

	@Test
	void unknownTypeIsRejected() throws Exception {
		mvc.perform(get("/api/v1/notices?type=fire"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors[0].field").value("type"));
	}

	@Test
	void aNoticeWithoutALocationIsListedAndHasNoCoordinates() throws Exception {
		TestData.insertNotice(jdbc, "library-hours", "public-notice", "2026-10-12T09:00:00+13:00", null, null, null,
				"public");

		assertThat(slugs("/api/v1/notices")).containsExactly("library-hours");
		Map<String, Object> notice = JsonPath.parse(body("/api/v1/notices/library-hours")).read("$");
		assertThat(notice).containsEntry("latitude", null)
			.containsEntry("longitude", null)
			.containsEntry("locationName", null);
	}

	@Test
	void detailHasExactlyTheDocumentedFields() throws Exception {
		TestData.insertNotice(jdbc, "works", "road-work", "2026-10-05T18:00:00+13:00", "2026-10-20T18:00:00+13:00",
				LAT, LNG, "public");

		Map<String, Object> notice = JsonPath.parse(body("/api/v1/notices/works")).read("$");

		assertThat(notice.keySet()).containsExactlyInAnyOrder("slug", "title", "type", "isOfficial", "startsAt",
				"endsAt", "summary", "locationName", "latitude", "longitude", "sourceOrg", "sourceUrl", "updatedAt",
				"ended");
		assertThat(notice).containsEntry("sourceOrg", "QLDC").containsEntry("ended", false);
		assertThat(((Number) notice.get("latitude")).doubleValue()).isCloseTo(LAT, within(1e-6));
		assertThat(((Number) notice.get("longitude")).doubleValue()).isCloseTo(LNG, within(1e-6));
	}

	@Test
	void anEndedNoticeStillHasItsPage() throws Exception {
		TestData.insertNotice(jdbc, "ended", "road-work", "2026-10-01T09:00:00+13:00", "2026-10-14T09:00:00+13:00",
				LAT, LNG, "public");

		mvc.perform(get("/api/v1/notices/ended")).andExpect(status().isOk()).andExpect(jsonPath("$.ended").value(true));
	}

	@Test
	void aPrivateOrMissingNoticeIsNotFound() throws Exception {
		TestData.insertNotice(jdbc, "hidden", "emergency", "2026-10-12T09:00:00+13:00", null, LAT, LNG, "private");

		mvc.perform(get("/api/v1/notices/hidden")).andExpect(status().isNotFound());
		mvc.perform(get("/api/v1/notices/nope")).andExpect(status().isNotFound());
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
