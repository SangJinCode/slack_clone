import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import {
  Routes, //여러 Route들을 감싸는 컨테이너. 현재 URL에 맞는 컴포넌트만 렌더링해줌.
  Route, //URL 경로(path)와 보여줄 컴포넌트(element)를 연결하는 컴포넌트
  BrowserRouter, //HTML5의 history API를 사용해서 브라우저 주소창과 React 라우팅을 연결해주는 최상위 컴포넌트, 보통 앱의 루트에서 한 번만 씀.
  useLocation, //현재 URL에 대한 정보를 알려줌.{ pathname, search, hash, state, key } 같은 값 포함.
  useNavigationType, //현재 페이지에 들어온 방식이 뭔지 알려줌. "PUSH" (링크 클릭, navigate), "POP" (뒤로/앞으로 가기), "REPLACE" (replace로 이동) 중 하나 반환.
  createRoutesFromChildren, //<Routes> 안에 있는 <Route>들을 읽어서 라우트 설정 객체 형태로 변환
  matchRoutes, //URL과 라우트 설정을 비교해서, 어떤 라우트가 매칭됐는지 알려줘.createRoutesFromChildren를 사용해 routes 객체를 생성 후 matchRoutes를 사용해 url과 비교
} from "react-router";

import { Toaster } from "react-hot-toast";

import * as Sentry from "@sentry/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AuthProvider from "./providers/AuthProvider.jsx";

const queryClient = new QueryClient();

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

// Sentry(에러 추적 + 성능 모니터링 도구) 를 React 앱에 붙이는 초기화 설정
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: 1.0,
 })


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
