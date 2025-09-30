export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 60초 미만: "방금 전"
  if (diffSeconds < 60) {
    return "방금 전";
  }

  // 1시간 미만: "N분 전"
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}분 전`;
  }

  // 오늘(자정 이후): "N시간 전"
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date.getTime() >= today.getTime()) {
    return `${Math.floor(diffSeconds / 3600)}시간 전`;
  }

  // 어제: "어제"
  const yesterday = new Date(today.getTime());
  yesterday.setDate(today.getDate() - 1);
  if (date.getTime() >= yesterday.getTime()) {
    return "어제";
  }

  // 그 외: "YYYY.MM.DD HH:mm" (ko-KR 로캘, 2자리 월/일)
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
