package com.queenstownlocal.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;
import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.Auth;
import com.queenstownlocal.backend.support.ClockConfiguration;
import com.queenstownlocal.backend.support.MutableClock;

/**
 * /admin/events and /admin/notices (ADMIN-03, ADMIN-04), and what the visitors' API shows of them
 * (S5). It is Wednesday 14 October 2026, 10:00 in Queenstown.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class AdminEventNoticeApiTest {

	private static final String MARKET = """
			{"title": "Lakefront Night Market", "description": "Food stalls.",
			 "startsAt": "2026-10-16T17:00:00+13:00", "endsAt": "2026-10-16T21:00:00+13:00",
			 "venueName": "Earnslaw Park", "address": "Marine Parade", "latitude": -45.0331, "longitude": 168.6597,
			 "imageUrl": null, "source": "Queenstown Events", "sourceUrl": "https://events.example/market",
			 "status": "public"}
			""";

	private static final String WORKS = """
			{"title": "Shotover Street resurfacing", "type": "road-work", "summary": "One lane closed.",
			 "startsAt": "2026-10-06T07:00:00+13:00", "endsAt": "2026-10-20T18:00:00+13:00",
			 "locationName": "Shotover Street", "latitude": -45.0305, "longitude": 168.6615,
			 "sourceOrg": "QLDC", "sourceUrl": "https://qldc.example/works", "isOfficial": true, "status": "public"}
			""";

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	private String admin;

	@BeforeEach
	void signedInAsAdmin() throws Exception {
		clock.set(ClockConfiguration.WEDNESDAY_MORNING);
		admin = Auth.adminToken(mvc, jdbc, "admin@example.com");
	}

	private ResultActions send(String method, String path, String json) throws Exception {
		var request = method.equals("POST") ? post(path) : put(path);
		return mvc.perform(request.header("Authorization", Auth.bearer(admin))
			.contentType(MediaType.APPLICATION_JSON)
			.content(json));
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
	}

	@Test
	void aPublicEventIsListedAndOnTheMapUntilItIsMadePrivate() throws Exception {
		String json = body(send("POST", "/api/v1/admin/events", MARKET).andExpect(status().isCreated())
			.andExpect(jsonPath("$.slug").value("lakefront-night-market"))
			.andExpect(jsonPath("$.startsAt").value("2026-10-16T04:00:00Z")));
		long id = JsonPath.<Number>read(json, "$.id").longValue();

		mvc.perform(get("/api/v1/events/lakefront-night-market")).andExpect(status().isOk())
			.andExpect(jsonPath("$.venueName").value("Earnslaw Park"));
		mvc.perform(get("/api/v1/map/markers?west=168.6&south=-45.1&east=168.7&north=-45.0&filter=event"))
			.andExpect(jsonPath("$.markers[0].slug").value("lakefront-night-market"));

		send("PUT", "/api/v1/admin/events/" + id, MARKET.replace("\"public\"", "\"private\""))
			.andExpect(status().isOk());

		mvc.perform(get("/api/v1/events/lakefront-night-market")).andExpect(status().isNotFound());
		mvc.perform(get("/api/v1/map/markers?west=168.6&south=-45.1&east=168.7&north=-45.0&filter=event"))
			.andExpect(jsonPath("$.markers").isEmpty());
	}

	@Test
	void anEventCannotEndBeforeItStarts() throws Exception {
		String json = body(send("POST", "/api/v1/admin/events",
				MARKET.replace("\"2026-10-16T21:00:00+13:00\"", "\"2026-10-16T16:00:00+13:00\""))
			.andExpect(status().isBadRequest()));

		assertThat(JsonPath.<List<String>>read(json, "$.errors[*].field")).containsExactly("endsAt");
	}

	@Test
	void eventsAreListedForTheAdminWhateverTheirStatus() throws Exception {
		send("POST", "/api/v1/admin/events", MARKET.replace("\"public\"", "\"private\""));

		mvc.perform(get("/api/v1/admin/events?status=private").header("Authorization", Auth.bearer(admin)))
			.andExpect(jsonPath("$.total").value(1))
			.andExpect(jsonPath("$.items[0].title").value("Lakefront Night Market"));
	}

	@Test
	void aPublicNoticeIsListedWithItsLocationAndOfficialMark() throws Exception {
		send("POST", "/api/v1/admin/notices", WORKS).andExpect(status().isCreated())
			.andExpect(jsonPath("$.slug").value("shotover-street-resurfacing"))
			.andExpect(jsonPath("$.isOfficial").value(true))
			.andExpect(jsonPath("$.latitude").value(-45.0305));

		mvc.perform(get("/api/v1/notices/shotover-street-resurfacing")).andExpect(status().isOk())
			.andExpect(jsonPath("$.isOfficial").value(true))
			.andExpect(jsonPath("$.locationName").value("Shotover Street"));
	}

	@Test
	void aNoticeMayHaveNoLocationButNotHalfOfOne() throws Exception {
		String noLocation = WORKS.replace("\"latitude\": -45.0305, \"longitude\": 168.6615",
				"\"latitude\": null, \"longitude\": null");
		send("POST", "/api/v1/admin/notices", noLocation).andExpect(status().isCreated())
			.andExpect(jsonPath("$.latitude").isEmpty());

		String half = WORKS.replace("\"longitude\": 168.6615", "\"longitude\": null");
		String json = body(send("POST", "/api/v1/admin/notices", half).andExpect(status().isBadRequest()));
		assertThat(JsonPath.<List<String>>read(json, "$.errors[*].field")).containsExactly("latitude");
	}

	@Test
	void aNoticeNeedsAKnownTypeAndTheOfficialFlag() throws Exception {
		String json = body(send("POST", "/api/v1/admin/notices",
				WORKS.replace("\"road-work\"", "\"fire\"").replace("\"isOfficial\": true", "\"isOfficial\": null"))
			.andExpect(status().isBadRequest()));

		assertThat(JsonPath.<List<String>>read(json, "$.errors[*].field")).containsExactlyInAnyOrder("type",
				"isOfficial");
	}

	@Test
	void noticesFilterByType() throws Exception {
		send("POST", "/api/v1/admin/notices", WORKS);
		send("POST", "/api/v1/admin/notices", WORKS.replace("\"road-work\"", "\"emergency\""));

		mvc.perform(get("/api/v1/admin/notices?type=emergency").header("Authorization", Auth.bearer(admin)))
			.andExpect(jsonPath("$.total").value(1))
			.andExpect(jsonPath("$.items[0].slug").value("shotover-street-resurfacing-2"));
	}

}
