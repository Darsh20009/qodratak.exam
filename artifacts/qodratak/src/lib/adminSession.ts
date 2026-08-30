const ADMIN_ACCESS_TOKEN_KEY = 'qodratak_admin_access_token';

export function setAdminAccessToken(token: string | undefined) {
  if (token) {
    sessionStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  }
}

export function clearAdminAccessToken() {
  sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
}

export function installAdminFetchBridge() {
  if (typeof window === 'undefined') return;

  const bridgeWindow = window as typeof window & { __qodratakAdminFetchBridge?: boolean };
  if (bridgeWindow.__qodratakAdminFetchBridge) return;
  bridgeWindow.__qodratakAdminFetchBridge = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    const pathname = new URL(requestUrl, window.location.origin).pathname;
    const token = sessionStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);

    if (!token || !pathname.startsWith('/api/admin')) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', `Bearer ${token}`);
    return nativeFetch(input, { ...init, headers });
  };
}