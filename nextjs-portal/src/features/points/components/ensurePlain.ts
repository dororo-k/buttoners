import { Timestamp } from 'firebase/firestore';

/**
 * 객체를 재귀적으로 순회하며 직렬화 불가능한 값을 안전한 형태로 변환합니다.
 * - Firestore Timestamp -> ISO 8601 문자열
 * - Date -> ISO 8601 문자열
 * - Map -> 일반 객체
 * - Set -> 배열
 * - BigInt -> 문자열
 * @param data 변환할 데이터 (객체, 배열, 원시값 등)
 * @returns 직렬화 가능한 순수 객체/배열/값
 */
export function ensurePlainObject<T>(data: T): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Firestore Timestamp 객체 처리
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  // JavaScript Date 객체 처리
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Map 객체 처리
  if (data instanceof Map) {
    return Object.fromEntries(
      Array.from(data.entries()).map(([key, value]) => [key, ensurePlainObject(value)])
    );
  }

  // Set 객체 처리
  if (data instanceof Set) {
    return Array.from(data.values()).map(ensurePlainObject);
  }

  // BigInt 처리
  if (typeof data === 'bigint') {
    return data.toString();
  }

  // 배열 처리
  if (Array.isArray(data)) {
    return data.map(ensurePlainObject);
  }

  // 일반 객체 처리
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, ensurePlainObject(value)])
    );
  }

  // 원시값(string, number, boolean)은 그대로 반환
  return data;
}
