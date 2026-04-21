package com.kh.trip.config;

import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.security.CustomUserDetailsService;
import com.kh.trip.security.JwtProvider;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

	private final JwtProvider jwtProvider;
	private final CustomUserDetailsService customUserDetailsService;

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

		if (accessor == null) {
			return message;
		}

		if (StompCommand.CONNECT.equals(accessor.getCommand())
				|| StompCommand.SEND.equals(accessor.getCommand())
				|| StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
			// 프론트가 STOMP native header의 Authorization에 Bearer 토큰을 넣으면
			// HTTP 필터와 별도로 WebSocket 세션 인증을 복원한다.
			if (accessor.getUser() == null) {
				String token = extractBearerToken(accessor);
				if (token != null && jwtProvider.validateToken(token) && "ACCESS".equals(jwtProvider.getTokenType(token))) {
					AuthUserPrincipal authUser = customUserDetailsService.loadUserByUserNo(jwtProvider.getUserNo(token));
					UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
							authUser, null, authUser.getAuthorities());
					accessor.setUser(authentication);
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			}
		}

		return message;
	}

	private String extractBearerToken(StompHeaderAccessor accessor) {
		List<String> authHeaders = accessor.getNativeHeader("Authorization");
		if (authHeaders == null || authHeaders.isEmpty()) {
			return null;
		}

		String headerValue = authHeaders.get(0);
		if (headerValue == null || !headerValue.startsWith("Bearer ")) {
			return null;
		}

		return headerValue.substring(7);
	}
}
