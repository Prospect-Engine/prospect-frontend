export const getQueryParams = (param: string) => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);
    return value ? decodeURIComponent(value) : null;
  }
  return null;
};
