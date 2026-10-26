package com.queenstownlocal.backend.place;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;
import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.TestData;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class PlaceListApiTest {

	private static final String URL = "/api/v1/places";

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	// From the Queenstown centre: a about 170 m, b about 380 m, e about 460 m, c (Frankton) about 5.6 km.
	// d sits next to the centre but is private.
	@BeforeEach
	void seed() {
		TestData.insertPlace(jdbc, "a", "Lakeside Kitchen", "food", null, -45.0322, 168.6610, "public",
				"12 Beach Street", "Lakefront restaurant with wood-fired pizza.");
		TestData.insertPlace(jdbc, "b", "Harbour Coffee", "cafe", null, -45.0335, 168.6590, "public",
				"5 Marine Parade", null);
		TestData.insertPlace(jdbc, "c", "Frankton Slice Bar", "food", null, -45.0195, 168.7320, "public", "Frankton",
				"Pizza by the slice.");
		TestData.insertPlace(jdbc, "d", "Hidden Bar", "bar", null, -45.0313, 168.6627, "private", "1 Camp Street",
				"Pizza too.");
		TestData.insertPlace(jdbc, "e", "Earnslaw Park Toilets", "facility", "toilet", -45.0325, 168.6570, "public",
				"Earnslaw Park", null);
	}

	@Test
	void listsPublicPlacesNearestToTheCentreFirst() throws Exception {
		String json = body(get(URL));

		assertThat(JsonPath.<List<String>>read(json, "$.items[*].slug")).containsExactly("a", "b", "e", "c");
		assertThat(JsonPath.<Integer>read(json, "$.page")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(json, "$.size")).isEqualTo(20);
		assertThat(JsonPath.<Integer>read(json, "$.total")).isEqualTo(4);
		List<Map<String, Object>> items = JsonPath.read(json, "$.items");
		assertThat(items).allSatisfy(item -> assertThat(item).containsEntry("distanceM", null));
	}

	@Test
	void itemHasExactlyTheListFields() throws Exception {
		jdbc.sql("update place set opening_hours = 'Mo-Su 10:00-20:30' where slug = 'a'").update();
		String json = body(get(URL));
		Map<String, Object> a = item(json, "a");

		assertThat(a.keySet()).containsExactlyInAnyOrder("slug", "name", "category", "subtype", "address", "imageUrl",
				"latitude", "longitude", "distanceM", "openingHours");
		assertThat(a).containsEntry("name", "Lakeside Kitchen")
			.containsEntry("category", "food")
			.containsEntry("subtype", null)
			.containsEntry("address", "12 Beach Street")
			.containsEntry("imageUrl", null)
			.containsEntry("openingHours", "Mo-Su 10:00-20:30");
		assertThat(item(json, "e")).containsEntry("subtype", "toilet");
	}

	@Test
	void sortsFromTheGivenPositionAndFillsDistance() throws Exception {
		String json = body(get(URL).param("lat", "-45.0195").param("lng", "168.7320"));

		assertThat(JsonPath.<List<String>>read(json, "$.items[*].slug")).containsExactly("c", "a", "b", "e");
		assertThat(item(json, "c")).containsEntry("distanceM", 0);
		// An Integer, so the JSON number had no decimal point.
		assertThat(item(json, "a").get("distanceM")).isInstanceOf(Integer.class);
		assertThat((Integer) item(json, "a").get("distanceM")).isBetween(5650, 5870);
	}

	@Test
	void categoryNarrowsTheList() throws Exception {
		String json = body(get(URL).param("category", "food"));

		assertThat(JsonPath.<List<String>>read(json, "$.items[*].slug")).containsExactly("a", "c");
		assertThat(JsonPath.<Integer>read(json, "$.total")).isEqualTo(2);
	}

	@Test
	void searchMatchesNameDescriptionAndAddressIgnoringCase() throws Exception {
		assertThat(slugs(get(URL).param("q", "PIZZA"))).containsExactly("a", "c");
		assertThat(slugs(get(URL).param("q", "marine"))).containsExactly("b");
		assertThat(slugs(get(URL).param("q", "harbour"))).containsExactly("b");
	}

	@Test
	void everyWordOfTheQueryMustMatch() throws Exception {
		assertThat(slugs(get(URL).param("q", "pizza frankton"))).containsExactly("c");

		String json = body(get(URL).param("q", "pizza marine"));
		assertThat(JsonPath.<List<String>>read(json, "$.items[*].slug")).isEmpty();
		assertThat(JsonPath.<Integer>read(json, "$.total")).isEqualTo(0);
	}

	@Test
	void searchTreatsWildcardCharactersAsText() throws Exception {
		assertThat(slugs(get(URL).param("q", "%"))).isEmpty();
		assertThat(slugs(get(URL).param("q", "_"))).isEmpty();
		assertThat(slugs(get(URL).param("q", "\\"))).isEmpty();
		assertThat(slugs(get(URL).param("q", "'"))).isEmpty();

		TestData.insertPlace(jdbc, "f", "100% Pure Cafe", "cafe", null, -45.0312, 168.6626, "public", "2 The Mall",
				null);
		assertThat(slugs(get(URL).param("q", "100%"))).containsExactly("f");
	}

	@Test
	void blankQueryMeansNoSearch() throws Exception {
		assertThat(slugs(get(URL).param("q", ""))).hasSize(4);
		assertThat(slugs(get(URL).param("q", "  "))).hasSize(4);
	}

	@Test
	void searchAndCategoryCombine() throws Exception {
		assertThat(slugs(get(URL).param("q", "pizza").param("category", "food"))).containsExactly("a", "c");
		assertThat(slugs(get(URL).param("q", "pizza").param("category", "cafe"))).isEmpty();
	}

	@Test
	void pagesThroughTheList() throws Exception {
		String first = body(get(URL).param("size", "2"));
		assertThat(JsonPath.<List<String>>read(first, "$.items[*].slug")).containsExactly("a", "b");
		assertThat(JsonPath.<Integer>read(first, "$.page")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(first, "$.size")).isEqualTo(2);
		assertThat(JsonPath.<Integer>read(first, "$.total")).isEqualTo(4);

		String second = body(get(URL).param("page", "2").param("size", "2"));
		assertThat(JsonPath.<List<String>>read(second, "$.items[*].slug")).containsExactly("e", "c");
		assertThat(JsonPath.<Integer>read(second, "$.page")).isEqualTo(2);
		assertThat(JsonPath.<Integer>read(second, "$.total")).isEqualTo(4);

		String third = body(get(URL).param("page", "3").param("size", "2"));
		assertThat(JsonPath.<List<String>>read(third, "$.items[*].slug")).isEmpty();
		assertThat(JsonPath.<Integer>read(third, "$.total")).isEqualTo(4);
	}

	@Test
	void placesAtTheSamePointKeepOneOrder() throws Exception {
		for (String slug : List.of("s1", "s2", "s3")) {
			TestData.insertPlace(jdbc, slug, "shopping", null, -45.0300, 168.6600, "public");
		}

		for (int page = 1; page <= 3; page++) {
			MockHttpServletRequestBuilder request = get(URL).param("category", "shopping")
				.param("size", "1")
				.param("page", String.valueOf(page));
			assertThat(slugs(request)).containsExactly("s" + page);
		}
	}

	@Test
	void unknownCategoryIsRejected() throws Exception {
		expectRejected(get(URL).param("category", "hotel"), "category");
	}

	@Test
	void positionNeedsBothCoordinates() throws Exception {
		expectRejected(get(URL).param("lat", "-45.03"), "lng");
		expectRejected(get(URL).param("lng", "168.66"), "lat");
	}

	@Test
	void positionOutOfRangeIsRejected() throws Exception {
		expectRejected(get(URL).param("lat", "91").param("lng", "0"), "lat");
		expectRejected(get(URL).param("lat", "0").param("lng", "181"), "lng");
		expectRejected(get(URL).param("lat", "NaN").param("lng", "0"), "lat");
	}

	@Test
	void pageAndSizeOutOfRangeAreRejected() throws Exception {
		expectRejected(get(URL).param("page", "0"), "page");
		expectRejected(get(URL).param("size", "0"), "size");
		expectRejected(get(URL).param("size", "51"), "size");
		expectRejected(get(URL).param("page", "abc"), "page");
	}

	@Test
	void tooLongQueryIsRejected() throws Exception {
		expectRejected(get(URL).param("q", "x".repeat(101)), "q");
		assertThat(slugs(get(URL).param("q", "x".repeat(100)))).isEmpty();
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
		return JsonPath.read(body(request), "$.items[*].slug");
	}

	private Map<String, Object> item(String json, String slug) {
		List<Map<String, Object>> found = JsonPath.read(json, "$.items[?(@.slug == '" + slug + "')]");
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

}
