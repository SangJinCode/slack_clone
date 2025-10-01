// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";
import { ENV } from "./src/config/env.js";

//글로벌 Sentry 클라이언트 생성
Sentry.init({
  dsn: ENV.SENTRY_DSN, //에러/로그를 어느 프로젝트로 보낼지 Sentry 서버 주소를 지정
  tracesSampleRate: 1.0, //1.0 = 100% 수집 → 모든 API 요청, DB 쿼리 트랜잭션이 기록됨
  profilesSampleRate: 1.0, //1.0 = 100% 수집, CPU 사용량, 함수 실행 시간 같은 성능 데이터 기록
  environment: ENV.NODE_ENV || "development", //어떤 환경에서 발생한 에러인지 구분 (production, staging, development 등)
  includeLocalVariables: true, //에러 발생 시 스택 트레이스 안의 로컬 변수 값까지 Sentry로 전송

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true, //PII (Personally Identifiable Information, 개인식별정보)를 전송할지 여부
});