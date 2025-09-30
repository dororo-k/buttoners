"use client";
import React, { useState } from "react";
import { loginAction } from "@/features/staff/actions";
import { redirect } from "next/navigation";

export default function AuthForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await (loginAction as any)({ message: "" }, formData);
      if (res && typeof res.message === "string" && res.message !== "success") {
        setMessage(res.message);
      } else if (res && res.message === "success") {
        redirect("/");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {message && message !== "success" && <div>{message}</div>}

      <input
        name="name"
        placeholder="닉네임"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="password"
        name="password"
        placeholder="비밀번호(숫자 4자리)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={pending}>
        {pending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
