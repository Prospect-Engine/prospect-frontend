/**
 * Unwraps Ashborn API responses from the standard wrapper format.
 *
 * Ashborn wraps all responses in: { success: true, data: {...} }
 * This utility extracts the inner data for components that expect raw data.
 *
 * @param response - The API response (either wrapped ashborn or raw white-walker format)
 * @returns The unwrapped data
 */
export function unwrapAshbornResponse<T>(response: unknown): T {
  // Handle ashborn wrapped format: {success: true, data: {...}}
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "data" in response
  ) {
    return (response as { success: boolean; data: T }).data;
  }
  // Return as-is for white-walker legacy format or already unwrapped
  return response as T;
}
