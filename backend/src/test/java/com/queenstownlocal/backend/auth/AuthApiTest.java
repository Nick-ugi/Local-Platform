package com.queenstownlocal.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

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

/** POST /auth/signup, /auth/login, /auth/refresh, /auth/logout and GET /me. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class AuthApiTest {

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

	private ResultActions postJson(String path, String body) throws Exception {
		return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body));
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
	}

	private ResultActions refresh(String refreshToken) throws Exception {
		return postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}");
	}

	@Test
	void signupSignsInAsAUserAndStoresOnlyHashes() throws Exception {
		String json = body(postJson("/api/v1/auth/signup", "{\"email\":\"Kiri@example.com\",\"password\":\"" + Auth.PASSWORD + "\"}")
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.expiresIn").value(900))
			.andExpect(jsonPath("$.user.email").value("Kiri@example.com"))
			.andExpect(jsonPath("$.user.role").value("user")));

		String refreshToken = JsonPath.read(json, "$.refreshToken");
		String passwordHash = jdbc.sql("select password_hash from app_user").query(String.class).single();
		String tokenHash = jdbc.sql("select token_hash from refresh_token").query(String.class).single();
		assertThat(passwordHash).startsWith("$2").doesNotContain(Auth.PASSWORD);
		assertThat(tokenHash).hasSize(64).isNotEqualTo(refreshToken);

		mvc.perform(get("/api/v1/me").header("Authorization", Auth.bearer(JsonPath.read(json, "$.accessToken"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("Kiri@example.com"))
			.andExpect(jsonPath("$.role").value("user"));
	}

	@Test
	void anEmailCanHaveOneAccountWhateverItsCase() throws Exception {
		Auth.signup(mvc, "kiri@example.com");

		postJson("/api/v1/auth/signup", "{\"email\":\"KIRI@example.com\",\"password\":\"" + Auth.PASSWORD + "\"}")
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("EMAIL_ALREADY_USED"));
	}

	@Test
	void signupChecksTheEmailAndThePassword() throws Exception {
		postJson("/api/v1/auth/signup", "{\"email\":\"not-an-email\",\"password\":\"short\"}")
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.errors[?(@.field == 'email')]").exists())
			.andExpect(jsonPath("$.errors[?(@.field == 'password')]").exists());
	}

	@Test
	void loginWorksWithAnyCaseAndRefusesBothFailuresAlike() throws Exception {
		Auth.signup(mvc, "kiri@example.com");

		postJson("/api/v1/auth/login", "{\"email\":\"KIRI@example.com\",\"password\":\"" + Auth.PASSWORD + "\"}")
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.user.email").value("kiri@example.com"));

		String wrongPassword = body(postJson("/api/v1/auth/login", "{\"email\":\"kiri@example.com\",\"password\":\"wrong password\"}")
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS")));
		String noAccount = body(postJson("/api/v1/auth/login", "{\"email\":\"nobody@example.com\",\"password\":\"wrong password\"}")
			.andExpect(status().isUnauthorized()));
		assertThat(JsonPath.<String>read(noAccount, "$.detail")).isEqualTo(JsonPath.read(wrongPassword, "$.detail"));
	}

	@Test
	void aRefreshTokenWorksOnceAndGivesANewPair() throws Exception {
		String first = JsonPath.read(Auth.signup(mvc, "kiri@example.com"), "$.refreshToken");

		String json = body(refresh(first).andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("user")));
		String second = JsonPath.read(json, "$.refreshToken");

		assertThat(second).isNotEqualTo(first);
		refresh(first).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
		refresh(second).andExpect(status().isOk());
	}

	@Test
	void aRefreshTokenEndsAfterThirtyDays() throws Exception {
		String token = JsonPath.read(Auth.signup(mvc, "kiri@example.com"), "$.refreshToken");

		clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofDays(30)));

		refresh(token).andExpect(status().isUnauthorized());
	}

	@Test
	void anUnknownRefreshTokenIsRefused() throws Exception {
		refresh("made-up").andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
	}

	@Test
	void logoutRevokesTheTokenAndCanBeRepeated() throws Exception {
		String token = JsonPath.read(Auth.signup(mvc, "kiri@example.com"), "$.refreshToken");

		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"" + token + "\"}").andExpect(status().isNoContent());
		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"" + token + "\"}").andExpect(status().isNoContent());

		refresh(token).andExpect(status().isUnauthorized());
	}

}
