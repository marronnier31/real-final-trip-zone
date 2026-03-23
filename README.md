# TripZone

TripZone 프론트엔드와 설계 문서 허브를 함께 관리하는 저장소다.  
현재 기준은 `프론트 우선`, `백엔드는 팀원 연결용 최소 골격 유지`, `설계 문서는 HTML 대시보드로 제공`이다.

## 프로젝트 목적

- 국내 숙소 예약 서비스 프론트 구현
- 설계도, 기준서, DDL, 발표자료를 한 번에 볼 수 있는 제출용 HTML 패키지 제공
- 팀원이 이후 백엔드 API, DB, 상태 처리 로직을 바로 이어붙일 수 있는 기준점 유지

## 핵심 기준

- 루트 패키지명: `com.kh.trip`
- 문의 모델: `InquiryRoom`, `InquiryMessage`
- DB 기준 원문: `docs/tripzone-ddl-v2.sql`
- 통합 설계 기준: `docs/tripzone-company-spec.md`
- 구조 기준: `docs/tripzone-structure-spec-v2.md`

## 저장소 구조

- `frontend/`
  - React + Vite 프론트엔드
  - 현재 사용자 / 판매자 / 관리자 화면, 마이페이지, 인증, 예약 흐름 포함
- `backend/`
  - 팀원용 최소 백엔드 루트
  - 실제 API/DB 연결은 여기 기준으로 이어서 구현
- `docs/`
  - 설계 원본 문서
  - 요구사항, 기능, 구조, DB, 통합 기준, DDL, 코멘트 포함
- `frontend/public/submission-html/`
  - 현재 기준 제출용 HTML 세트
  - 대시보드 1장 + 설계 문서 HTML + 발표자료 HTML

## 로컬 실행

### 프론트 실행

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

기본 확인 주소:

- 메인 앱: `http://127.0.0.1:5173/`
- 설계 대시보드: `http://127.0.0.1:5173/submission-html/`
- 발표자료: `http://127.0.0.1:5173/submission-html/presentation/`

### 빌드 확인

```bash
cd frontend
npm run build
```

## 설계 문서 HTML 링크

모든 설계 문서는 `frontend/public/submission-html/` 기준으로 제공된다.

### 메인 대시보드

- 설계 대시보드: `/submission-html/`

### 핵심 문서

- 요구사항 명세서: `/submission-html/docs/requirements.html`
- 기능 명세서: `/submission-html/docs/features.html`
- 구조 명세서: `/submission-html/docs/structure.html`
- DB 명세서: `/submission-html/docs/database.html`

### 확장 기준 문서

- 통합 기준서: `/submission-html/docs/company.html`
- 구조 기준 v2: `/submission-html/docs/structure-v2.html`
- DDL 기준 요약: `/submission-html/docs/ddl.html`
- 제출 문서 안내: `/submission-html/docs/submission-guide.html`
- 수정 코멘트: `/submission-html/docs/comments.html`

### 발표자료

- 발표자료 HTML deck: `/submission-html/presentation/`

## 현재 구현 범위

### 프론트

- 메인
- 검색 리스트
- 숙소 상세
- 예약
- 로그인 / 회원가입 / 아이디 찾기 / 비밀번호 찾기
- 마이페이지 허브 및 세부 화면
- 판매자 / 관리자 화면
- 설계 문서 대시보드

### 설계도 기준으로 이미 맞춘 것

- 사용자 / 판매자 / 관리자 흐름
- 마이페이지 요구사항 추가 반영
- 리뷰는 숙박 완료 예약 기준
- 문의는 `문의방 + 메시지` 구조
- 판매자/관리자 액션은 mock 상태 변경까지 포함

## 팀원 전달 포인트

이 저장소는 지금 상태에서 아래 목적에 바로 사용 가능하다.

### 1. 프론트 확인

- 화면 흐름 확인
- 페이지 이동 확인
- 설계도 기준 UI/상태 mock 확인

### 2. 설계 문서 확인

- 대시보드에서 설계도/기준서/DDL/발표자료 한 번에 이동
- 발표 직전 또는 제출 직전 확인 용도

### 3. 백엔드 연결 시작점

팀원이 이어서 붙일 때 우선 보면 되는 파일:

- 설계 기준: `docs/tripzone-company-spec.md`
- 구조 기준: `docs/tripzone-structure-spec-v2.md`
- DB 기준: `docs/tripzone-ddl-v2.sql`
- 프론트 라우트 기준: `frontend/src/router/AppRouter.jsx`
- mock 데이터 기준: `frontend/src/data/siteData.js`

## Oracle DB 연결 가이드

백엔드는 Oracle 기준으로 붙이는 것을 전제로 한다.

### 기준 원문

- 실행 DDL 원문: `docs/tripzone-ddl-v2.sql`
- DB 명세 요약: `docs/04_DB명세서.md`
- 통합 설계 기준: `docs/tripzone-company-spec.md`

### Oracle 기준 고정 사항

- PK는 기본적으로 `NUMBER(10)` + 시퀀스 사용
- 문자열은 `VARCHAR2`
- 등록/수정일은 `REG_DATE`, `UPD_DATE`
- soft-delete가 필요한 테이블은 `DELETED_AT` 사용
- 날짜 기본값은 `SYSDATE`
- 상태값은 문자열 컬럼 + `CHECK` 제약 기준으로 맞춘다

### 추천 구현 순서

1. `MEMBER_GRADES`, `USERS`, `USER_AUTH_PROVIDERS`, `USER_ROLES`
2. `HOST_PROFILES`
3. `EVENTS`, `COUPONS`, `USER_COUPONS`, `EVENT_COUPONS`
4. `LODGINGS`, `ROOMS`, `LODGING_IMAGES`
5. `BOOKINGS`, `PAYMENTS`
6. `REVIEWS`, `REVIEW_IMAGES`, `WISHLISTS`
7. `MILEAGE_HISTORY`, `USER_REFRESH_TOKENS`
8. `INQUIRY_ROOMS`, `INQUIRY_MESSAGES`
9. `AUDIT_LOGS`

### 핵심 상태값

- 회원 상태: `ACTIVE`, `DORMANT`, `BLOCKED`, `DELETED`
- 판매자 상태: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- 예약 상태: `PENDING`, `CONFIRMED`, `CANCELED`, `COMPLETED`, `NO_SHOW`
- 결제 상태: `READY`, `PAID`, `FAILED`, `CANCELED`, `PARTIAL_CANCELED`, `REFUNDED`
- 문의 상태: `OPEN`, `ANSWERED`, `CLOSED`, `BLOCKED`

### 프론트에서 바로 API로 치환할 지점

- 인증 세션 mock: `frontend/src/utils/authSession.js`
- 관리자/판매자 상태 변경 mock: `frontend/src/utils/mockStorage.js`
- 문의센터 mock: `frontend/src/utils/myInquiryCenter.js`
- 초기 화면 mock 데이터: `frontend/src/data/siteData.js`

### 백엔드 팀원 체크리스트

- 루트 패키지명은 `com.kh.trip`으로 고정
- 문의 도메인은 `InquiryRoom`, `InquiryMessage` 2단 구조 유지
- 프론트 라우트 기준 키는 `userId`, `lodgingId`, `roomId`, `bookingId`, `couponId` 중심으로 맞춘다
- 예약/리뷰/문의 흐름은 프론트가 이미 연결돼 있으므로 응답 스키마만 맞추면 교체가 쉽다
- 최신순 정렬이 필요한 화면은 API에서 정렬까지 내려주는 쪽이 안전하다
- Oracle 제약/시퀀스 이름은 가능하면 DDL 원문을 그대로 따른다

### 가장 먼저 붙이면 좋은 API

1. 인증/세션
2. 숙소 목록/상세/객실
3. 예약/결제
4. 마이페이지 예약/쿠폰/마일리지/결제내역
5. 문의센터
6. 판매자 관리
7. 관리자 운영

## 주의

- 현재 상태는 프론트 중심 구현 + mock 액션 기준이다.
- 실제 DB 영속화, 인증, 결제 API, 관리자 처리 로직은 팀원 백엔드 구현이 필요하다.
- HTML 대시보드 기준 경로는 `frontend/public/submission-html/`가 현재 소스 오브 트루스다.
