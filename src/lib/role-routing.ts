"use client";

type AppRole = "admin" | "staff";

const DEFAULT_PORTS: Record<AppRole, string> = {
  admin: "9999",
  staff: "9090",
};

const getRolePort = (role: AppRole) =>
  role === "admin"
    ? process.env.NEXT_PUBLIC_ADMIN_PORT || DEFAULT_PORTS.admin
    : process.env.NEXT_PUBLIC_STAFF_PORT || DEFAULT_PORTS.staff;

export const isCurrentRolePort = (role: AppRole) => {
  if (typeof window === "undefined") {
    return true;
  }

  return window.location.port === getRolePort(role);
};

export const getCurrentPathWithSearch = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const buildRoleUrl = (role: AppRole, path = "/") => {
  if (typeof window === "undefined") {
    return path;
  }

  const target = new URL(path, window.location.origin);
  target.port = getRolePort(role);
  return target.toString();
};

export const redirectToRoleUrl = (
  role: AppRole,
  path = "/",
  replace = true,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const targetUrl = buildRoleUrl(role, path);

  if (replace) {
    window.location.replace(targetUrl);
    return;
  }

  window.location.assign(targetUrl);
};
