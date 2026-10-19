package com.queenstownlocal.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.queenstownlocal.backend.TestcontainersConfiguration;

/**
 * The production profile behind a proxy (Caddy on a server, Render's load balancer): the server starts
 * with a real JWT_SECRET, and the login limit counts each visitor by the address the proxy forwards,
 * not by the proxy's own address. A real port, because the forwarded address is read by Tomcat.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT,
		properties = "app.jwt.secret=a-production-like-secret-of-more-than-32-bytes-0123")
@ActiveProfiles("prod")
@Import(TestcontainersConfiguration.class)
class AuthRateLimitBehindProxyTest {

	@LocalServerPort
	int port;

	private final HttpClient http = HttpClient.newHttpClient();

	private int wrongLoginForwardedFor(String visitor) throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/auth/login"))
			.header("Content-Type", "application/json")
			.header("X-Forwarded-For", visitor)
			.POST(HttpRequest.BodyPublishers
				.ofString("{\"email\":\"nobody@example.com\",\"password\":\"not the password\"}"))
			.build();
		return http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
	}

	@Test
	void startsWithARealSecretAndAnswersHealth() throws Exception {
		HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/actuator/health")).build();

		assertThat(http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(200);
	}

	@Test
	void visitorsBehindTheSameProxyAreCountedApart() throws Exception {
		for (int i = 0; i < 20; i++) {
			assertThat(wrongLoginForwardedFor("203.0.113.1")).isEqualTo(401);
			assertThat(wrongLoginForwardedFor("203.0.113.2")).isEqualTo(401);
		}

		assertThat(wrongLoginForwardedFor("203.0.113.1")).isEqualTo(429);
		assertThat(wrongLoginForwardedFor("203.0.113.2")).isEqualTo(429);
		assertThat(wrongLoginForwardedFor("203.0.113.3")).isEqualTo(401);
	}

}
