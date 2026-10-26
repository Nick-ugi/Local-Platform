package com.queenstownlocal.backend.me;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

/** GET /me/favorites, PUT and DELETE /me/favorites/{slug}. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class FavoriteApiTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	private String token;

	@BeforeEach
	void signedIn() throws Exception {
		clock.set(ClockConfiguration.WEDNESDAY_MORNING);
		token = Auth.userToken(mvc, "kiri@example.com");
		TestData.insertPlace(jdbc, "lakeside-kitchen", "food", null, -45.0322, 168.6610, "public");
		TestData.insertPlace(jdbc, "harbour-coffee", "cafe", null, -45.0335, 168.6590, "public");
		TestData.insertPlace(jdbc, "closed-bar", "bar", null, -45.0300, 168.6600, "private");
	}

	private ResultActions save(String slug) throws Exception {
		return mvc.perform(put("/api/v1/me/favorites/" + slug).header("Authorization", Auth.bearer(token)));
	}

	private ResultActions remove(String slug) throws Exception {
		return mvc.perform(delete("/api/v1/me/favorites/" + slug).header("Authorization", Auth.bearer(token)));
	}

	private List<String> savedSlugs() throws Exception {
		String json = mvc.perform(get("/api/v1/me/favorites").header("Authorization", Auth.bearer(token)))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
		return JsonPath.read(json, "$.items[*].slug");
	}

	@Test
	void listsSavedPlacesMostRecentFirstWithTheListFields() throws Exception {
		save("lakeside-kitchen").andExpect(status().isNoContent());
		clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofMinutes(5)));
		save("harbour-coffee").andExpect(status().isNoContent());

		assertThat(savedSlugs()).containsExactly("harbour-coffee", "lakeside-kitchen");

		String json = mvc.perform(get("/api/v1/me/favorites").header("Authorization", Auth.bearer(token)))
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
		Map<String, Object> body = JsonPath.read(json, "$");
		Map<String, Object> first = JsonPath.read(json, "$.items[0]");
		assertThat(body.keySet()).containsExactly("items");
		assertThat(first.keySet()).containsExactlyInAnyOrder("slug", "name", "category", "subtype", "address",
				"imageUrl", "latitude", "longitude", "distanceM", "openingHours");
		assertThat(first.get("distanceM")).isNull();
	}

	@Test
	void savingTwiceKeepsOneAndRemovingTwiceIsFine() throws Exception {
		save("lakeside-kitchen").andExpect(status().isNoContent());
		save("lakeside-kitchen").andExpect(status().isNoContent());
		assertThat(savedSlugs()).containsExactly("lakeside-kitchen");

		remove("lakeside-kitchen").andExpect(status().isNoContent());
		remove("lakeside-kitchen").andExpect(status().isNoContent());
		remove("never-saved").andExpect(status().isNoContent());
		assertThat(savedSlugs()).isEmpty();
	}

	@Test
	void aMissingOrPrivatePlaceCannotBeSaved() throws Exception {
		save("no-such-place").andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
		save("closed-bar").andExpect(status().isNotFound());
	}

	@Test
	void aPlaceThatBecomesPrivateLeavesTheList() throws Exception {
		save("lakeside-kitchen");
		jdbc.sql("update place set status = 'private' where slug = 'lakeside-kitchen'").update();

		assertThat(savedSlugs()).isEmpty();
	}

	@Test
	void eachAccountHasItsOwnFavorites() throws Exception {
		save("lakeside-kitchen");
		token = Auth.userToken(mvc, "aroha@example.com");

		assertThat(savedSlugs()).isEmpty();
	}

	@Test
	void favoritesNeedASignedInAccount() throws Exception {
		mvc.perform(get("/api/v1/me/favorites")).andExpect(status().isUnauthorized());
		mvc.perform(put("/api/v1/me/favorites/lakeside-kitchen")).andExpect(status().isUnauthorized());
		mvc.perform(delete("/api/v1/me/favorites/lakeside-kitchen")).andExpect(status().isUnauthorized());
	}

}
