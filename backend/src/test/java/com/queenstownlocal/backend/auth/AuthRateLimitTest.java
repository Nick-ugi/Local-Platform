package com.queenstownlocal.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.Auth;
import com.queenstownlocal.backend.support.ClockConfiguration;
import com.queenstownlocal.backend.support.MutableClock;

/**
 * Log in and sign up are limited to 20 tries per address in 10 minutes (docs/06-api-specification.md,
 * section 1, TOO_MANY_REQUESTS). Each test uses addresses of its own: the limiter lives as long as the
 * application context, which the test classes share.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class AuthRateLimitTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	MutableClock clock;

	@BeforeEach
	void wednesdayMorning() {
		this.clock.set(ClockConfiguration.WEDNESDAY_MORNING);
	}

	private ResultActions wrongLogin(String address) throws Exception {
		return mvc.perform(post("/api/v1/auth/login").with(Auth.fromAddress(address))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"nobody@example.com\",\"password\":\"not the password\"}"));
	}

	private ResultActions signup(String address, int n) throws Exception {
		return mvc.perform(post("/api/v1/auth/signup").with(Auth.fromAddress(address))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"limit" + n + "@example.com\",\"password\":\"" + Auth.PASSWORD + "\"}"));
	}

	@Test
	void theTwentyFirstLoginFromOneAddressIsRefused() throws Exception {
		for (int i = 0; i < 20; i++) {
			wrongLogin("198.51.100.1").andExpect(status().isUnauthorized());
		}

		wrongLogin("198.51.100.1").andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"))
			.andExpect(header().string("Retry-After", "600"));
	}

	@Test
	void theLimitLiftsWhenTenMinutesHavePassed() throws Exception {
		for (int i = 0; i < 21; i++) {
			wrongLogin("198.51.100.2");
		}
		this.clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofMinutes(4)));
		wrongLogin("198.51.100.2").andExpect(status().isTooManyRequests())
			.andExpect(header().string("Retry-After", "360"));

		this.clock.set(ClockConfiguration.WEDNESDAY_MORNING.plus(Duration.ofMinutes(10)));
		wrongLogin("198.51.100.2").andExpect(status().isUnauthorized());
	}

	@Test
	void otherAddressesAreNotLimited() throws Exception {
		for (int i = 0; i < 21; i++) {
			wrongLogin("198.51.100.3");
		}

		wrongLogin("198.51.100.4").andExpect(status().isUnauthorized());
	}

	@Test
	void signUpHasTheSameLimit() throws Exception {
		for (int i = 0; i < 20; i++) {
			signup("198.51.100.5", i).andExpect(status().isCreated());
		}

		signup("198.51.100.5", 20).andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"));
	}

}
