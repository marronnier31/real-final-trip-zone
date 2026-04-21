package com.kh.trip.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.kh.trip.controller.formatter.LocalDateFormatter;

@Configuration
public class CustomServletConfig implements WebMvcConfigurer {

	@Value("${com.kh.upload.path}")
	private String uploadPath;

	@Override
	public void addFormatters(FormatterRegistry registry) {
		registry.addFormatter(new LocalDateFormatter());
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**").allowedOrigins("*")
				.allowedMethods("HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH").maxAge(300)
				.allowedHeaders("Authorization", "Cache-Control", "Content-Type")
				// 웹소켓 연결 시 필요한 다양한 헤더를 수용하도록 "*"로 설정하거나 더 확장
				.allowedHeaders("*");
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		// 브라우저에서 접근하는 url(/api/view/파일명)
		registry.addResourceHandler("/api/view/**")
				// 실제 업로드 폴더에서 파일을 찾아 전달
				.addResourceLocations(Paths.get(uploadPath).toAbsolutePath().normalize().toUri().toString());
	}

}
