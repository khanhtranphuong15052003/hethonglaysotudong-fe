const trimTrailingSlash = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const ensureApiSuffix = (value: string) => {
  const normalized = trimTrailingSlash(value.trim());
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const stripApiSuffix = (value: string) => {
  const normalized = trimTrailingSlash(value.trim());
  return normalized.endsWith("/api")
    ? normalized.slice(0, -"/api".length)
    : normalized;
};

export const getPublicApiBase = () => {
  const explicitApiBase = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (explicitApiBase) {
    return ensureApiSuffix(explicitApiBase);
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicApiUrl) {
    return ensureApiSuffix(publicApiUrl);
  }

  return "";
};

export const getServerApiBase = () => {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (backendApiUrl) {
    return ensureApiSuffix(backendApiUrl);
  }

  return getPublicApiBase();
};

export const getSocketBaseUrl = () => {
  const explicitSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicitSocketUrl) {
    return trimTrailingSlash(explicitSocketUrl);
  }

  const explicitApiBase = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (explicitApiBase) {
    return stripApiSuffix(explicitApiBase);
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicApiUrl) {
    return stripApiSuffix(publicApiUrl);
  }

  return "";
};
