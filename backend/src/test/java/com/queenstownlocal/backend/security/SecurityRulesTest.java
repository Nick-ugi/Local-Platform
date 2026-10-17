package com.queenstownlocal.backend.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.Auth;
import com.queenstownlocal.backend.support.ClockConfiguration;
import com.queenstownlocal.backend.support.MutableClock;

/** Who may call what (docs/06-api-specification.md, section 1). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class SecurityRulesTest {

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
	void thePublicApiNeedsNoToken() throws Exception {
		mvc.perform(get("/api/v1/places")).andExpect(status().isOk());
		mvc.perform(get("/api/v1/sitemap")).andExpect(status().isOk());
		mvc.perform(get("/actuator/health")).andExpect(status().isOk());
	}

	@Test
	void meWithoutATokenIsUnauthorizedInTheApisFormat() throws Exception {
		mvc.perform(get("/api/v1/me"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
			.andExpect(jsonPath("$.status").value(401));
	}

	@Test
	void aTokenWithAWrongSignatureIsRefused() throws Exception {
		String token = Auth.userToken(mvc, "kiri@example.com");
		String[] parts = token.split("\\.");
		String forged = parts[0] + "." + parts[1] + "." + "x" + parts[2].substring(1);

		mvc.perform(get("/api/v1/me").header("Authorization", Auth.bearer(forged)))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
	}

	@Test
	void anAccessTokenEndsAfterFifteenMinutes() throws Exception {
		String token = Auth.userToken(mvc, "kiri@example.com");

		clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofMinutes(14)));
		mvc.perform(get("/api/v1/me").header("Authorization", Auth.bearer(token))).andExpect(status().isOk());

		clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofMinutes(16)));
		mvc.perform(get("/api/v1/me").header("Authorization", Auth.bearer(token)))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void adminNeedsTheAdminRole() throws Exception {
		mvc.perform(get("/api/v1/admin/places")).andExpect(status().isUnauthorized());

		String user = Auth.userToken(mvc, "kiri@example.com");
		mvc.perform(get("/api/v1/admin/places").header("Authorization", Auth.bearer(user)))
			.andExpect(status().isForbidden())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

}
