import { useAuth } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";

import AuthPage from "./pages/AuthPage";
import CallPage from "./pages/CallPage";
import HomePage from "./pages/HomePage";

import * as Sentry from "@sentry/react";

import React from "react";


// 원래 쓰던 Routes 대신 SentryRoutes를 쓰게 되고, 그 안에서 페이지 이동, 에러 발생, 성능 트레이스 등이 Sentry에 자동으로 기록
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes)


const App = () => {
  const { isSignedIn, isLoaded } = useAuth();
  
  console.log("isSignedIn", isSignedIn)

  if( !isLoaded ) {
    return null
  }

  return (
    <>
       <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      >
        Break the world
      </button>
      <SentryRoutes>
        {/* replace 속성을 주면 브라우저 히스토리 스택에 새로운 기록을 남기지 않고 현재 항목을 교체 */}
        <Route path="/" element={isSignedIn ? <HomePage /> : <Navigate to={"/auth"} replace />} />
        <Route path="/auth" element={!isSignedIn ? <AuthPage /> : <Navigate to={"/"} replace />} />

        <Route path="/call/:id" element={isSignedIn ? <CallPage /> : <Navigate to={"/auth"} replace />} />
        {/* "*" 정의되지 않은 경로의 매핑 */}
        <Route path="*" element={isSignedIn ? <Navigate to={"/"} replace /> : <Navigate to={"/auth"} replace />} />
      </SentryRoutes>
    </>
   
  );
};

export default App;