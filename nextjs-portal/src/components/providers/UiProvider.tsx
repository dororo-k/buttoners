"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import React from "react";

export default function UiProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider defaultColorScheme="light">
      {/* 로그인/로그아웃 피드백 → 오른쪽 상단 */}
      <Notifications position="top-right" zIndex={9999} />
      {children}
    </MantineProvider>
  );
}
