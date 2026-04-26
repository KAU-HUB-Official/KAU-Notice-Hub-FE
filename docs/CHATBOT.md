# 챗봇 동작 문서

## 개요
챗봇은 "검색 기반 컨텍스트 주입" 방식으로 동작합니다.
핵심 구현 파일:
- `src/app/api/chat/route.ts`
- `src/server/ai/chat-service.ts`
- `src/server/notices/notice-service.ts`

## 요청/응답 흐름
1. 클라이언트가 `/api/chat`에 질문 전송
2. 서버가 질문으로 관련 공지 검색 (`findRelevantNotices`, 기본 6건)
3. 검색 결과를 컨텍스트 문자열로 구성
4. OpenAI에 system+user 메시지로 전달
5. 모델 응답 + 근거 공지(`references`) 반환

## 필터 파라미터(선택)
`/api/chat` 요청 body에 아래 필터를 넣을 수 있습니다.
- `audienceGroup`
- `sourceGroup`
- `source`

필터를 함께 보내면 해당 범위에서만 근거 공지를 찾습니다.
`source`는 `audienceGroup`이 `학부 재학생(학과/전공별)`, `대학원생`, `평생·전문교육원`인 경우에만 적용됩니다.

## fallback 모드
다음 경우 fallback 응답으로 전환됩니다.
- `OPENAI_API_KEY` 미설정
- OpenAI 호출 예외 발생

응답의 `usedFallback`으로 모드 확인 가능
- `true`: fallback
- `false`: OpenAI 응답

## 현재 제약
- 컨텍스트 상한: 최대 6개 공지
- 컨텍스트에 없는 정보는 답변하기 어려움
- 완전한 RAG(벡터 검색)는 아님

## 디버깅 체크리스트
1. `references`에 기대 공지가 포함되는지 확인
2. `usedFallback` 값 확인
3. 질문 문구를 더 구체화해서 재시도
4. `src/lib/notices.ts`의 검색 규칙/불용어 점검
