
export const formatStaffName = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  
  // Lấy chữ cái đầu của phần trước, sau đó là tên cuối viết hoa
  const abbreviated = parts
    .slice(0, -1)
    .map((part) => part.charAt(0).toUpperCase())
    .join(".");
  
  return `${abbreviated}.${parts[parts.length - 1].toUpperCase()}`;
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
