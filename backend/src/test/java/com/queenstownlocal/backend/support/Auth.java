package com.queenstownlocal.backend.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

/** Accounts and tokens for API tests, made through the API itself. */
public final class Auth {

	public static final String PASSWORD = "correct horse battery";

	private static final AtomicInteger NEXT_ADDRESS = new AtomicInteger();

	private Auth() {
	}

	/** A request from the given client address. */
	public static RequestPostProcessor fromAddress(String address) {
		return request -> {
			request.setRemoteAddr(address);
			return request;
		};
	}

	/**
	 * A request from an address no other request used, so the log in and sign up limit (20 per address
	 * in 10 minutes) never counts the accounts tests make for themselves.
	 */
	public static RequestPostProcessor fromNewAddress() {
		int n = NEXT_ADDRESS.incrementAndGet();
		return fromAddress("10." + (n >> 16 & 255) + "." + (n >> 8 & 255) + "." + (n & 255));
	}

	/** Signs up and returns the token response as JSON. */
	public static String signup(MockMvc mvc, String email) throws Exception {
		return mvc
			.perform(post("/api/v1/auth/signup").with(fromNewAddress()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
	}

	/** An access token for a new account with the role user. */
	public static String userToken(MockMvc mvc, String email) throws Exception {
		return JsonPath.read(signup(mvc, email), "$.accessToken");
	}

	/** An access token for a new account whose role was then set to admin, as the README says to. */
	public static String adminToken(MockMvc mvc, JdbcClient jdbc, String email) throws Exception {
		signup(mvc, email);
		jdbc.sql("update app_user set role = 'admin' where email = :email").param("email", email).update();
		String json = mvc
			.perform(post("/api/v1/auth/login").with(fromNewAddress()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString(StandardCharsets.UTF_8);
		return JsonPath.read(json, "$.accessToken");
	}

	public static String bearer(String token) {
		return "Bearer " + token;
	}

}
