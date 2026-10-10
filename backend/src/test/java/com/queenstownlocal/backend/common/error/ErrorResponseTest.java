package com.queenstownlocal.backend.common.error;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ErrorProbeController.class)
@Import({ ErrorProbeController.class, GlobalExceptionHandler.class })
class ErrorResponseTest {

	private static final MediaType PROBLEM_JSON = MediaType.APPLICATION_PROBLEM_JSON;

	@Autowired
	MockMvc mvc;

	@Test
	void apiExceptionBecomesProblemDetail() throws Exception {
		mvc.perform(get("/probe/not-found"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(404))
			.andExpect(jsonPath("$.title").value("Not Found"))
			.andExpect(jsonPath("$.detail").value("Place not found."))
			.andExpect(jsonPath("$.code").value("NOT_FOUND"))
			.andExpect(jsonPath("$.errors").doesNotExist());
	}

	@Test
	void invalidArgumentNamesTheField() throws Exception {
		mvc.perform(get("/probe/invalid"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.detail").value("Validation failed."))
			.andExpect(jsonPath("$.errors[0].field").value("west"))
			.andExpect(jsonPath("$.errors[0].message").value("must be less than east"));
	}

	@Test
	void invalidBodyListsFieldErrors() throws Exception {
		mvc.perform(post("/probe/validate").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.detail").value("Validation failed."))
			.andExpect(jsonPath("$.errors[0].field").value("name"))
			.andExpect(jsonPath("$.errors[0].message").value(not(emptyString())));
	}

	@Test
	void malformedJsonIsValidationFailed() throws Exception {
		mvc.perform(post("/probe/validate").contentType(MediaType.APPLICATION_JSON).content("{\"name\":"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.errors").isEmpty());
	}

	@Test
	void wrongParameterTypeNamesTheParameter() throws Exception {
		mvc.perform(get("/probe/param").param("size", "abc"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.errors[0].field").value("size"));
	}

	@Test
	void missingParameterNamesTheParameter() throws Exception {
		mvc.perform(get("/probe/param"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
			.andExpect(jsonPath("$.errors[0].field").value("size"));
	}

	@Test
	void unexpectedErrorHidesTheMessage() throws Exception {
		mvc.perform(get("/probe/boom"))
			.andExpect(status().isInternalServerError())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
			.andExpect(content().string(not(containsString("hunter2"))));
	}

	@Test
	void unknownPathIsNotFound() throws Exception {
		mvc.perform(get("/api/v1/nope"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("NOT_FOUND"))
			.andExpect(jsonPath("$.detail").value("Not found."));
	}

	@Test
	void wrongMethodIsMethodNotAllowed() throws Exception {
		mvc.perform(post("/probe/not-found"))
			.andExpect(status().isMethodNotAllowed())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
	}

}
