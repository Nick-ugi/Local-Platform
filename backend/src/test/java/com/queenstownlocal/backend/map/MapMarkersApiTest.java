package com.queenstownlocal.backend.map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
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
class MapMarkersApiTest {

	private static final String URL = "/api/v1/map/markers";

	/** Central Queenstown. a, b, d and e are inside, c is not. */
	private static final Map<String, String> BOX = Map.of("west", "168.65", "south", "-45.04", "east", "168.67",
			"north", "-45.02");

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	// a: Queenstown centre, b: about 170 m away, c: Frankton about 5.6 km away,
	// d: next to a but private, e: a public toilet near the lakefront
	@BeforeEach
	void seed() {
		// Wednesday 14 October 2026, 10:00 in Queenstown.
		clock.set(ClockConfiguration.WEDNESDAY_MORNING);
		TestData.insertPlace(jdbc, "a", "food", null, -45.0312, 168.6626, "public");
		TestData.insertPlace(jdbc, "b", "cafe", null, -45.0322, 168.6610, "public");
		TestData.insertPlace(jdbc, "c", "shopping", null, -45.0195, 168.7320, "public");
		TestData.insertPlace(jdbc, "d", "bar", null, -45.0313, 168.6627, "private");
		TestData.insertPlace(jdbc, "e", "facility", "toilet", -45.0331, 168.6597, "public");
	}

	@Test
	void returnsPublicPlacesInsideTheBox() throws Exception {
		String json = body(markers());

		assertThat(JsonPath.<List<String>>read(json, "$.markers[*].slug")).containsExactlyInAnyOrder("a", "b", "e");
		assertThat(JsonPath.<Boolean>read(json, "$.truncated")).isFalse();
	}

	@Test
	void markerHasExactlyTheDocumentedFields() throws Exception {
		String json = body(markers());
		Map<String, Object> b = marker(json, "b");

		assertThat(b.keySet()).containsExactlyInAnyOrder("kind", "slug", "latitude", "longitude", "name", "category",
				"subtype");
		assertThat(b).containsEntry("kind", "place")
			.containsEntry("slug", "b")
			.containsEntry("name", "b")
			.containsEntry("category", "cafe");
		assertThat(((Number) b.get("latitude")).doubleValue()).isCloseTo(-45.0322, within(1e-6));
		assertThat(((Number) b.get("longitude")).doubleValue()).isCloseTo(168.6610, within(1e-6));
		assertThat(b.get("subtype")).isNull();
		assertThat(marker(json, "e")).containsEntry("category", "facility").containsEntry("subtype", "toilet");
	}

	// A map zoomed far out asks for a box like these. Read as a shape on the globe, its long edges
	// would take the short way round and leave Queenstown outside.
	@Test
	void aBoxWiderThanHalfTheWorldStillHoldsItsPlaces() throws Exception {
		assertThat(slugs(markers(Map.of("west", "-10", "east", "179")))).containsExactlyInAnyOrder("a", "b", "e");
		assertThat(slugs(markers(Map.of("west", "-180", "south", "-90", "east", "180", "north", "90"))))
			.containsExactlyInAnyOrder("a", "b", "c", "e");
	}

	@Test
	void filterNarrowsByCategory() throws Exception {
		assertThat(slugs(markers().param("filter", "cafe"))).containsExactly("b");
	}

	@Test
	void filterAcceptsSeveralCategories() throws Exception {
		assertThat(slugs(markers().param("filter", "food,cafe"))).containsExactlyInAnyOrder("a", "b");
	}

	@Test
	void eventsAndNoticesThatAreOnJoinThePlaces() throws Exception {
		insertEventsAndNotices();

		assertThat(slugs(markers())).containsExactlyInAnyOrder("a", "b", "e", "market", "works");
	}

	@Test
	void filterChoosesKinds() throws Exception {
		insertEventsAndNotices();

		assertThat(slugs(markers().param("filter", "event"))).containsExactly("market");
		assertThat(slugs(markers().param("filter", "notice,food"))).containsExactlyInAnyOrder("works", "a");
	}

	@Test
	void eventAndNoticeMarkersHaveTheirOwnFields() throws Exception {
		insertEventsAndNotices();
		String json = body(markers());

		Map<String, Object> event = marker(json, "market");
		assertThat(event.keySet()).containsExactlyInAnyOrder("kind", "slug", "latitude", "longitude", "title",
				"startsAt", "endsAt", "venueName");
		assertThat(event).containsEntry("kind", "event")
			.containsEntry("startsAt", "2026-10-16T04:00:00Z")
			.containsEntry("endsAt", "2026-10-16T08:00:00Z")
			.containsEntry("venueName", "Earnslaw Park");

		Map<String, Object> notice = marker(json, "works");
		assertThat(notice.keySet()).containsExactlyInAnyOrder("kind", "slug", "latitude", "longitude", "title", "type",
				"isOfficial", "startsAt", "endsAt");
		assertThat(notice).containsEntry("kind", "notice")
			.containsEntry("type", "road-work")
			.containsEntry("isOfficial", true)
			.containsEntry("endsAt", null);
	}

	@Test
	void aPlaceAndAnEventMayShareASlug() throws Exception {
		TestData.insertEvent(jdbc, "a", "2026-10-16T17:00:00+13:00", null, "public");

		String json = body(markers());

		assertThat(JsonPath.<List<String>>read(json, "$.markers[?(@.slug == 'a')].kind"))
			.containsExactlyInAnyOrder("place", "event");
	}

	@Test
	void datedMarkersAreKeptWhenTheAreaHoldsTooMany() throws Exception {
		insertEventsAndNotices();
		insertPlacesInTheBox(600);

		String json = body(markers());

		assertThat(JsonPath.<List<String>>read(json, "$.markers[*].slug")).hasSize(500)
			.startsWith("works", "market");
		assertThat(JsonPath.<Boolean>read(json, "$.truncated")).isTrue();
	}

	@Test
	void emptyFilterMeansEverything() throws Exception {
		assertThat(slugs(markers().param("filter", ""))).containsExactlyInAnyOrder("a", "b", "e");
	}

	@Test
	void unknownFilterValueIsRejected() throws Exception {
		expectRejected(markers().param("filter", "food,hotel"), "filter");
	}

	@Test
	void missingEdgeIsRejected() throws Exception {
		expectRejected(get(URL).param("south", "-45.04").param("east", "168.67").param("north", "-45.02"), "west");
	}

	@Test
	void invertedBoxIsRejected() throws Exception {
		expectRejected(markers(Map.of("west", "168.67", "east", "168.65")), "west");
		expectRejected(markers(Map.of("south", "-45.02", "north", "-45.04")), "south");
	}

	@Test
	void outOfRangeEdgeIsRejected() throws Exception {
		expectRejected(markers(Map.of("north", "91")), "north");
		expectRejected(markers(Map.of("west", "-181")), "west");
	}

	@Test
	void nonFiniteEdgeIsRejected() throws Exception {
		expectRejected(markers(Map.of("west", "NaN")), "west");
		expectRejected(markers(Map.of("east", "Infinity")), "east");
	}

	@Test
	void edgeThatIsNotANumberIsRejected() throws Exception {
		expectRejected(markers(Map.of("west", "abc")), "west");
		expectRejected(markers(Map.of("east", "")), "east");
		expectRejected(markers(Map.of("south", "-Infinity")), "south");
	}

	@Test
	void boxWithoutAreaIsRejected() throws Exception {
		expectRejected(markers(Map.of("west", "168.66", "east", "168.66")), "west");
	}

	@Test
	void truncatesAtFiveHundred() throws Exception {
		insertPlacesInTheBox(501);

		String json = body(markers());

		assertThat(JsonPath.<List<String>>read(json, "$.markers[*].slug")).hasSize(500);
		assertThat(JsonPath.<Boolean>read(json, "$.truncated")).isTrue();
	}

	@Test
	void fiveHundredExactlyIsNotTruncated() throws Exception {
		insertPlacesInTheBox(497);

		String json = body(markers());

		assertThat(JsonPath.<List<String>>read(json, "$.markers[*].slug")).hasSize(500);
		assertThat(JsonPath.<Boolean>read(json, "$.truncated")).isFalse();
	}

	private MockHttpServletRequestBuilder markers() {
		return markers(Map.of());
	}

	/** A request for the default box with some of its edges replaced. */
	private MockHttpServletRequestBuilder markers(Map<String, String> edges) {
		Map<String, String> params = new LinkedHashMap<>(BOX);
		params.putAll(edges);
		MockHttpServletRequestBuilder request = get(URL);
		params.forEach((name, value) -> request.param(name, value));
		return request;
	}

	private String body(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request)
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
	}

	private List<String> slugs(MockHttpServletRequestBuilder request) throws Exception {
		return JsonPath.read(body(request), "$.markers[*].slug");
	}

	private Map<String, Object> marker(String json, String slug) {
		List<Map<String, Object>> found = JsonPath.read(json, "$.markers[?(@.slug == '" + slug + "')]");
		assertThat(found).hasSize(1);
		return found.get(0);
	}

	private void expectRejected(MockHttpServletRequestBuilder request, String field) throws Exception {
		mvc.perform(request)
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.errors[0].field").value(field));
	}

	/**
	 * Inside the box: the event "market" on Friday and the notice "works" without an end. Left out
	 * of the map: an event that is over, a notice that has ended, a notice without a location and a
	 * private one.
	 */
	private void insertEventsAndNotices() {
		TestData.insertEvent(jdbc, "market", "2026-10-16T17:00:00+13:00", "2026-10-16T21:00:00+13:00", "public");
		TestData.insertEvent(jdbc, "over", "2026-10-13T17:00:00+13:00", "2026-10-13T21:00:00+13:00", "public");
		TestData.insertNotice(jdbc, "works", "road-work", "2026-10-05T18:00:00+13:00", null, -45.0312, 168.6626,
				"public");
		TestData.insertNotice(jdbc, "ended", "road-work", "2026-10-01T09:00:00+13:00", "2026-10-14T09:00:00+13:00",
				-45.0312, 168.6626, "public");
		TestData.insertNotice(jdbc, "nowhere", "public-notice", "2026-10-12T09:00:00+13:00", null, null, null,
				"public");
		TestData.insertNotice(jdbc, "hidden", "emergency", "2026-10-12T09:00:00+13:00", null, -45.0312, 168.6626,
				"private");
	}

	/** Adds public places along a line inside the default box, next to the three the seed put there. */
	private void insertPlacesInTheBox(int count) {
		jdbc.sql("""
				insert into place (slug, name, category, address, location, source, source_url, status)
				select 'bulk-' || n, 'bulk-' || n, 'food', 'addr',
				       ST_SetSRID(ST_MakePoint(168.66 + n * 0.00001, -45.03), 4326)::geography,
				       'test', 'https://example.com', 'public'
				from generate_series(1, :count) as n
				""").param("count", count).update();
	}

}
