package com.queenstownlocal.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

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
import com.queenstownlocal.backend.support.TestData;

/** /admin/places (ADMIN-02). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class AdminPlaceApiTest {

	private static final String KITCHEN = """
			{"name": "Lakeside Kitchen", "category": "food", "subtype": null, "description": "Lakefront restaurant.",
			 "address": "12 Beach Street", "latitude": -45.0322, "longitude": 168.661,
			 "openingHours": "Mon - Sun · 8:00 am - 10:00 pm", "phone": "03 000 0000",
			 "website": "https://lakesidekitchen.example", "imageUrl": "", "source": "Business website",
			 "sourceUrl": "https://lakesidekitchen.example/about", "status": "public"}
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

	private ResultActions create(String json) throws Exception {
		return mvc.perform(post("/api/v1/admin/places").header("Authorization", Auth.bearer(admin))
			.contentType(MediaType.APPLICATION_JSON)
			.content(json));
	}

	private ResultActions update(long id, String json) throws Exception {
		return mvc.perform(put("/api/v1/admin/places/" + id).header("Authorization", Auth.bearer(admin))
			.contentType(MediaType.APPLICATION_JSON)
			.content(json));
	}

	private ResultActions list(String query) throws Exception {
		return mvc.perform(get("/api/v1/admin/places" + query).header("Authorization", Auth.bearer(admin)));
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
	}

	@Test
	void createsAPlaceWithASlugFromItsNameAndEveryField() throws Exception {
		String json = body(create(KITCHEN).andExpect(status().isCreated()));
		Map<String, Object> place = JsonPath.read(json, "$");

		assertThat(place.keySet()).containsExactlyInAnyOrder("id", "slug", "name", "category", "subtype",
				"description", "address", "latitude", "longitude", "openingHours", "phone", "website", "imageUrl",
				"source", "sourceUrl", "status", "createdAt", "updatedAt");
		assertThat(place).containsEntry("slug", "lakeside-kitchen")
			.containsEntry("name", "Lakeside Kitchen")
			.containsEntry("status", "public")
			.containsEntry("createdAt", "2026-10-13T21:00:00Z");
		// An empty optional field is stored as nothing.
		assertThat(place.get("imageUrl")).isNull();

		// Public, so the visitors' API shows it.
		mvc.perform(get("/api/v1/places/lakeside-kitchen"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Lakeside Kitchen"));
	}

	@Test
	void theSameNameTwiceGetsANumber() throws Exception {
		create(KITCHEN).andExpect(jsonPath("$.slug").value("lakeside-kitchen"));
		create(KITCHEN).andExpect(jsonPath("$.slug").value("lakeside-kitchen-2"));
	}

	@Test
	void updatingChangesTheFieldsButNotTheSlug() throws Exception {
		Number id = JsonPath.read(body(create(KITCHEN)), "$.id");
		// Within the access token's 15 minutes.
		clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofMinutes(10)));

		update(id.longValue(), KITCHEN.replace("Lakeside Kitchen", "Lakeside Bistro").replace("\"public\"", "\"private\""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.slug").value("lakeside-kitchen"))
			.andExpect(jsonPath("$.name").value("Lakeside Bistro"))
			.andExpect(jsonPath("$.status").value("private"))
			.andExpect(jsonPath("$.updatedAt").value("2026-10-13T21:10:00Z"));

		// Private: gone for visitors, still there for the admin.
		mvc.perform(get("/api/v1/places/lakeside-kitchen")).andExpect(status().isNotFound());
		mvc.perform(get("/api/v1/admin/places/" + id).header("Authorization", Auth.bearer(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Lakeside Bistro"));
	}

	@Test
	void anUnknownIdIsNotFound() throws Exception {
		mvc.perform(get("/api/v1/admin/places/999999").header("Authorization", Auth.bearer(admin)))
			.andExpect(status().isNotFound());
		update(999999, KITCHEN).andExpect(status().isNotFound());
	}

	@Test
	void reportsEveryWrongFieldAtOnce() throws Exception {
		String json = body(create("""
				{"name": "", "category": "hotel", "subtype": "toilet", "address": "x", "latitude": 91,
				 "longitude": null, "website": "javascript:alert(1)", "source": "s", "sourceUrl": "ftp://x",
				 "status": "draft"}
				""").andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED")));

		List<String> fields = JsonPath.read(json, "$.errors[*].field");
		assertThat(fields).contains("name", "category", "subtype", "latitude", "longitude", "website", "sourceUrl",
				"status");
	}

	@Test
	void aFacilityNeedsItsKind() throws Exception {
		String facility = KITCHEN.replace("\"food\"", "\"facility\"");

		String json = body(create(facility).andExpect(status().isBadRequest()));
		assertThat(JsonPath.<List<String>>read(json, "$.errors[*].field")).containsExactly("subtype");

		create(facility.replace("\"subtype\": null", "\"subtype\": \"toilet\"")).andExpect(status().isCreated())
			.andExpect(jsonPath("$.subtype").value("toilet"));
	}

	@Test
	void listsEveryStatusMostRecentlyChangedFirstWithFilters() throws Exception {
		TestData.insertPlace(jdbc, "old-cafe", "Old Cafe", "cafe", null, -45.03, 168.66, "private", "addr", null);
		jdbc.sql("update place set updated_at = timestamptz '2026-10-01 10:00:00+13' where slug = 'old-cafe'").update();
		create(KITCHEN);

		List<String> all = JsonPath.read(body(list("").andExpect(status().isOk())), "$.items[*].slug");
		assertThat(all).containsExactly("lakeside-kitchen", "old-cafe");

		assertThat(JsonPath.<List<String>>read(body(list("?status=private")), "$.items[*].slug"))
			.containsExactly("old-cafe");
		assertThat(JsonPath.<List<String>>read(body(list("?category=food")), "$.items[*].slug"))
			.containsExactly("lakeside-kitchen");
		assertThat(JsonPath.<List<String>>read(body(list("?q=old")), "$.items[*].slug")).containsExactly("old-cafe");
		list("?status=draft").andExpect(status().isBadRequest());
		list("").andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.page").value(1));
	}

}
