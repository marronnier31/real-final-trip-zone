package com.kh.trip.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
//WebSocket 메시지 핸들링 활성화, 메시지 브로커 사용허용
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

	public WebSocketConfig(WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor) {
		this.webSocketAuthChannelInterceptor = webSocketAuthChannelInterceptor;
	}
	/**
     * 메시지 브로커(Message Broker) 설정을 구성
     * 클라이언트가 메시지를 보낼 때와 받을 때의 경로 규칙 정의
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. 서버에서 클라이언트로 메시지를 보낼 때 사용할 prefix 설정
        // 클라이언트가 "/topic/..." 경로를 구독(subscribe)하고 있으면 메시지를 받을 수 있도록설정.
        // 보통 일대다(Pub/Sub) 통신에 사용됨.
        config.enableSimpleBroker("/topic");

        // 2. 클라이언트가 서버로 메시지를 보낼 때(발행) 사용할 prefix 설정
        //리액트에서 메시지를 보낼 때 주소 앞에 "/app"을 붙여야 @MessageMapping 컨트롤러로 전달된다.
        //리액트에서 "/app/chat"으로 보내면 서버의 @MessageMapping("/chat")이 실행됨.
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * 클라이언트가 WebSocket 서버에 처음 연결할 접속 지점(Endpoint)을 등록.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 리액트 new SockJS('http://localhost:8080/ws')로 연결을 시도하는 지점.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // 모든 도메인에서의 접속을 허용 (CORS 해결)
                .withSockJS(); // WebSocket을 지원하지 않는 브라우저를 위해 SockJS 폴백 기능을 활성화.
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
    	// STOMP CONNECT/SEND/SUBSCRIBE 시점에 JWT를 해석해서 WebSocket 세션에도 인증 사용자를 심는다.
    	registration.interceptors(webSocketAuthChannelInterceptor);
    }

}
