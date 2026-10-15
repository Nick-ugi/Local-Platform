package com.queenstownlocal.backend.place;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

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
import com.queenstownlocal.backend.support.TestData;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class PlaceDetailApiTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Test
	void returnsThePublicPlaceWithExactlyTheDocumentedFields() throws Exception {
		TestData.insertPlace(jdbc, "lakeside-kitchen", "food", null, -45.0322, 168.6610, "public");
		jdbc.sql("""
				update place
				set description = 'Lakefront restaurant.', opening_hours = 'Mon - Sun · 8:00 am - 10:00 pm',
				    phone = '03 000 0000', website = 'https://lakesidekitchen.example',
				    updated_at = timestamptz '2026-10-02 14:30:00+13'
				where slug = 'lakeside-kitchen'
				""").update();

		String json = mvc.perform(get("/api/v1/places/lakeside-kitchen"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
		Map<String, Object> body = JsonPath.parse(json).read("$");

		assertThat(body.keySet()).containsExactlyInAnyOrder("slug", "name", "category", "subtype", "address",
				"imageUrl", "latitude", "longitude", "description", "openingHours", "phone", "website", "source",
				"sourceUrl", "updatedAt");
		assertThat(body).containsEntry("slug", "lakeside-kitchen")
			.containsEntry("name", "lakeside-kitchen")
			.containsEntry("category", "food")
			.containsEntry("address", "addr")
			.containsEntry("description", "Lakefront restaurant.")
			.containsEntry("openingHours", "Mon - Sun · 8:00 am - 10:00 pm")
			.containsEntry("phone", "03 000 0000")
			.containsEntry("website", "https://lakesidekitchen.example")
			.containsEntry("source", "test")
			.containsEntry("sourceUrl", "https://example.com");
		assertThat(body.get("subtype")).isNull();
		assertThat(body.get("imageUrl")).isNull();
		assertThat(((Number) body.get("latitude")).doubleValue()).isCloseTo(-45.0322, within(1e-6));
		assertThat(((Number) body.get("longitude")).doubleValue()).isCloseTo(168.6610, within(1e-6));
		String updatedAt = (String) body.get("updatedAt");
		assertThat(updatedAt).endsWith("Z");
		assertThat(Instant.parse(updatedAt)).isEqualTo(Instant.parse("2026-10-02T01:30:00Z"));
	}

	@Test
	void returnsTheSubtypeOfAFacility() throws Exception {
		TestData.insertPlace(jdbc, "earnslaw-toilets", "facility", "toilet", -45.0331, 168.6597, "public");

		mvc.perform(get("/api/v1/places/earnslaw-toilets"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.category").value("facility"))
			.andExpect(jsonPath("$.subtype").value("toilet"));
	}

	@Test
	void privatePlaceIsNotFound() throws Exception {
		TestData.insertPlace(jdbc, "hidden-bar", "bar", null, -45.0312, 168.6626, "private");

		expectPlaceNotFound(mvc.perform(get("/api/v1/places/hidden-bar")));
	}

	@Test
	void unknownSlugIsNotFound() throws Exception {
		expectPlaceNotFound(mvc.perform(get("/api/v1/places/nope")));
	}

	@Test
	void oddSlugsAreNotFoundRatherThanErrors() throws Exception {
		List<String> paths = List.of("/api/v1/places/" + "a".repeat(2000), "/api/v1/places/%ED%95%9C%EA%B8%80",
				"/api/v1/places/%27%20drop%20table%20place--");

		for (String path : paths) {
			expectPlaceNotFound(mvc.perform(get(URI.create(path))));
		}
	}

	/** Spring Security's firewall turns away an escaped semicolon before the lookup; still a 404, not an error. */
	@Test
	void anEscapedSemicolonIsNotFound() throws Exception {
		mvc.perform(get(URI.create("/api/v1/places/%27%3B%20drop%20table%20place%3B--")))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	/** The detail is the service's own message, so this also proves the request reached the place lookup. */
	private void expectPlaceNotFound(ResultActions result) throws Exception {
		result.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("NOT_FOUND"))
			.andExpect(jsonPath("$.detail").value("Place not found."));
	}

}
