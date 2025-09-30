// c:\Users\cha\Desktop\project\buttoners\nextjs-portal\src\hooks\useToggle.ts
import { useCallback, useState } from 'react';

/**
 * boolean 값을 토글하는 간단한 훅입니다.
 * @param initialState - 초기 상태 (기본값: false)
 * @returns [상태, 토글 함수, 상태를 true로 설정하는 함수, 상태를 false로 설정하는 함수]
 */
export function useToggle(
  initialState = false
): [boolean, () => void, () => void, () => void] {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => setState((s) => !s), []);
  const setTrue = useCallback(() => setState(true), []);
  const setFalse = useCallback(() => setState(false), []);

  return [state, toggle, setTrue, setFalse];
}
