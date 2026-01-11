export const API_BASE_URL =
  process.env.NEXT_PUBLIC_CRM_BACKEND_URL ||
  (() => {
    throw new Error(
      "NEXT_PUBLIC_CRM_BACKEND_URL environment variable is not defined"
    );
  })();
