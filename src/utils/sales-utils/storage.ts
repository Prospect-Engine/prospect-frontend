// Utility functions for safe localStorage access in Next.js
// localStorage is not available during server-side rendering

export const getLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  }
};

export const removeLocalStorage = (key: string): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  }
};
