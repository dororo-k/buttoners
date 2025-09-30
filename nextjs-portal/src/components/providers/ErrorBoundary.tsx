"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // 오류가 발생하면 state를 업데이트하여 다음 렌더링에서 대체 UI를 표시합니다.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 실제 운영 환경에서는 이곳에 Sentry, LogRocket 같은 오류 로깅 서비스를 연동할 수 있습니다.
    console.error("ErrorBoundary가 포착한 오류:", error, errorInfo);
  }

  public render() {
    // 오류가 발생했다면, 자식 컴포넌트 대신 null을 렌더링하여 아무것도 표시하지 않습니다.
    return this.state.hasError ? null : this.props.children;
  }
}

export default ErrorBoundary;
