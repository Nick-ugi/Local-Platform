package com.queenstownlocal.backend.sitemap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class SitemapApiTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	@BeforeEach
	void seed() {
		clock.set(ClockConfiguration.WEDNESDAY_MORNING);
		TestData.insertPlace(jdbc, "kitchen", "food", null, -45.0312, 168.6626, "public");
		TestData.insertPlace(jdbc, "closed-bar", "bar", null, -45.0312, 168.6626, "private");
		TestData.insertEvent(jdbc, "market", "2026-10-16T17:00:00+13:00", null, "public");
		TestData.insertEvent(jdbc, "over", "2026-10-13T17:00:00+13:00", "2026-10-13T21:00:00+13:00", "public");
		TestData.insertNotice(jdbc, "works", "road-work", "2026-10-05T09:00:00+13:00", null, null, null, "public");
		TestData.insertNotice(jdbc, "ended", "road-work", "2026-10-01T09:00:00+13:00", "2026-10-14T09:00:00+13:00",
				null, null, "public");
	}

	@Test
	void listsThePagesTheListsShow() throws Exception {
		String json = mvc.perform(get("/api/v1/sitemap"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);

		assertThat(JsonPath.<List<String>>read(json, "$.places[*].slug")).containsExactly("kitchen");
		assertThat(JsonPath.<List<String>>read(json, "$.events[*].slug")).containsExactly("market");
		assertThat(JsonPath.<List<String>>read(json, "$.notices[*].slug")).containsExactly("works");
		Map<String, Object> place = JsonPath.read(json, "$.places[0]");
		assertThat(place.keySet()).containsExactlyInAnyOrder("slug", "updatedAt");
		assertThat((String) place.get("updatedAt")).endsWith("Z");
	}

}
