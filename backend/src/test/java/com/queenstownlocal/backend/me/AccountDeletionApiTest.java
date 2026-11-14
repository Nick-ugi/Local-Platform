package com.queenstownlocal.backend.me;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

/** DELETE /me: an account deleted by its owner, as Google Play asks of apps with sign up. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class AccountDeletionApiTest {

	private static final String EMAIL = "kiri@example.com";

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	private String token;

	private String refreshToken;

	@BeforeEach
	void signedInWithAFavorite() throws Exception {
		clock.set(ClockConfiguration.WEDNESDAY_MORNING);
		String tokens = Auth.signup(mvc, EMAIL);
		token = JsonPath.read(tokens, "$.accessToken");
		refreshToken = JsonPath.read(tokens, "$.refreshToken");
		TestData.insertPlace(jdbc, "lakeside-kitchen", "food", null, -45.0322, 168.6610, "public");
		mvc.perform(put("/api/v1/me/favorites/lakeside-kitchen").header("Authorization", Auth.bearer(token)))
			.andExpect(status().isNoContent());
	}

	private ResultActions deleteAccount(String accessToken, String password) throws Exception {
		var request = delete("/api/v1/me").with(Auth.fromNewAddress())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"password\":\"" + password + "\"}");
		return mvc.perform(accessToken == null ? request : request.header("Authorization", Auth.bearer(accessToken)));
	}

	private long count(String table) {
		return jdbc.sql("select count(*) from " + table).query(Long.class).single();
	}

	@Test
	void theRightPasswordDeletesTheAccountItsFavoritesAndItsSessions() throws Exception {
		deleteAccount(token, Auth.PASSWORD).andExpect(status().isNoContent());

		assertThat(jdbc.sql("select count(*) from app_user where email = :email")
			.param("email", EMAIL)
			.query(Long.class)
			.single()).isZero();
		assertThat(count("favorite")).isZero();
		assertThat(count("refresh_token")).isZero();
		mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
			.content("{\"refreshToken\":\"" + refreshToken + "\"}")).andExpect(status().isUnauthorized());
		// The email is free again.
		Auth.signup(mvc, EMAIL);
	}

	@Test
	void aWrongPasswordKeepsTheAccountAndIsNotASignedOutSession() throws Exception {
		deleteAccount(token, "not my password").andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("WRONG_PASSWORD"));

		assertThat(count("app_user")).isOne();
		assertThat(count("favorite")).isOne();
		mvc.perform(get("/api/v1/me").header("Authorization", Auth.bearer(token))).andExpect(status().isOk());
	}

	@Test
	void anAdminAccountIsNotDeletedThisWay() throws Exception {
		String admin = Auth.adminToken(mvc, jdbc, "ops@example.com");

		deleteAccount(admin, Auth.PASSWORD).andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("FORBIDDEN"));

		assertThat(jdbc.sql("select count(*) from app_user where email = 'ops@example.com'")
			.query(Long.class)
			.single()).isOne();
	}

	@Test
	void aPasswordIsNeededAndSoIsASignedInAccount() throws Exception {
		deleteAccount(token, "").andExpect(status().isBadRequest());
		deleteAccount(null, Auth.PASSWORD).andExpect(status().isUnauthorized());
		assertThat(count("app_user")).isOne();
	}

	@Test
	void theTokenLeftAfterDeletingIsNoLongerASignedInAccount() throws Exception {
		deleteAccount(token, Auth.PASSWORD).andExpect(status().isNoContent());

		mvc.perform(get("/api/v1/me").header("Authorization", Auth.bearer(token))).andExpect(status().isUnauthorized());
		mvc.perform(put("/api/v1/me/favorites/lakeside-kitchen").header("Authorization", Auth.bearer(token)))
			.andExpect(status().isUnauthorized());
		mvc.perform(get("/api/v1/me/favorites").header("Authorization", Auth.bearer(token)))
			.andExpect(status().isUnauthorized());
		deleteAccount(token, Auth.PASSWORD).andExpect(status().isUnauthorized());
	}

}
