
export const formatStaffName = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) {
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  const firstParts = parts.slice(0, -2);
  const lastTwoParts = parts.slice(-2);

  const abbreviated = firstParts
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join("");

  const formattedLastTwo = lastTwoParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  return `${abbreviated}${formattedLastTwo}`;
};


export const formatCustomerName = (name: string): string => {
  if (!name) return "";
  return name.trim().toUpperCase();
};


export const formatServiceName = (name: string): string => {
  if (!name) return "";
  return name.trim().toUpperCase();
};


export const abbreviateName = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  

  const abbreviated = parts
    .slice(0, -1)
    .map((part) => part.charAt(0).toUpperCase())
    .join(".");
  
  return `${abbreviated}.${parts[parts.length - 1].toUpperCase()}`;
};
