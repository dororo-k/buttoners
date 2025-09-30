export function getPersistentAnonName(): string {
  const SESSION_KEY = "anonNickname";
  let anonName = sessionStorage.getItem(SESSION_KEY);

  if (!anonName) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    anonName = `익명${randomNum}`;
    sessionStorage.setItem(SESSION_KEY, anonName);
  }
  return anonName;
}
