package com.queenstownlocal.backend.common.time;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The one source of "now". Whether an event or a notice is still shown depends on the time, so
 * services read it from this clock and pass it to their queries instead of using SQL's now().
 * Tests replace it with a clock they can set.
 */
@Configuration(proxyBeanMethods = false)
public class TimeConfiguration {

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
