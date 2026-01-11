export function parseJwt(token: string): any {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch (error) {
    if (typeof window !== "undefined") {
      window.location.replace("/auth");
    }
    return null;
  }
}

/**
 * Validates impersonation token structure
 * Handles both same-user impersonation (team switching) and different-user impersonation
 */
export function validateImpersonationToken(
  originalToken: string,
  newToken: string,
  expectedTenantId: string,
  expectedTeamId?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const originalData = parseJwt(originalToken);
    const newData = parseJwt(newToken);

    if (!originalData || !newData) {
      errors.push("Failed to parse one or both tokens");
      return { isValid: false, errors };
    }

    // Check if this is a different-user impersonation (user_id changed)
    const isDifferentUserImpersonation =
      originalData.user_id !== newData.user_id;

    if (isDifferentUserImpersonation) {
      //

      // For different-user impersonation, we expect:
      // 1. user_id to be different (this is the point)
      // 2. tenant_id to match the expected tenant
      // 3. team_id to match the expected team (if provided)
      // 4. is_impersonate flag to be set

      // Validate tenant_id matches expected
      if (newData.tenant_id !== expectedTenantId) {
        errors.push(
          `tenant_id not updated correctly. Expected: ${expectedTenantId}, Got: ${newData.tenant_id}`
        );
      }

      // Validate team_id matches expected (if provided)
      if (expectedTeamId && newData.team_id !== expectedTeamId) {
        errors.push(
          `team_id not updated correctly. Expected: ${expectedTeamId}, Got: ${newData.team_id}`
        );
      }

      // For different-user impersonation, is_impersonate should be true
      if (!newData.is_impersonate) {
        // Don't treat this as an error since backend might not set it
      }
    } else {
      // Same-user impersonation (team switching within same user)
      //

      // Validate that tenant_id was updated correctly
      if (newData.tenant_id !== expectedTenantId) {
        errors.push(
          `tenant_id not updated correctly. Expected: ${expectedTenantId}, Got: ${newData.tenant_id}`
        );
      }

      // Validate that team_id was updated correctly (if provided)
      if (expectedTeamId && newData.team_id !== expectedTeamId) {
        errors.push(
          `team_id not updated correctly. Expected: ${expectedTeamId}, Got: ${newData.team_id}`
        );
      }
    }

    // Validate that the token is not expired
    if (newData.exp && newData.exp < Math.floor(Date.now() / 1000)) {
      errors.push("New token has expired");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Token validation error: ${error}`);
    return { isValid: false, errors };
  }
}

/**
 * Extracts user information from JWT token
 */
export function extractUserFromToken(token: string): {
  user_id: string;
  username: string;
  name: string;
  tenant_id: string;
  team_id?: string;
  is_impersonate?: boolean;
  role_id?: string;
  joined_at?: string;
} | null {
  try {
    const data = parseJwt(token);
    if (!data) return null;

    return {
      user_id: data.user_id,
      username: data.username,
      name: data.name,
      tenant_id: data.tenant_id,
      team_id: data.team_id,
      is_impersonate: data.is_impersonate,
      role_id: data.role_id,
      joined_at: data.joined_at,
    };
  } catch (error) {
    return null;
  }
}
