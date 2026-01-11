import { useAuth } from "./useAuth";

/**
 * Custom hook for refreshing user data after organization/workspace operations
 * This ensures consistent behavior across all components that need to update user data
 */
export const useUserDataRefresh = () => {
  const { refreshUserData } = useAuth();

  const refreshUserDataAfterOperation = async (
    operationName: string,
    success: boolean
  ): Promise<boolean> => {
    if (!success) {
      return false;
    }

    try {
      //
      const refreshSuccess = await refreshUserData();

      if (refreshSuccess) {
        //
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  return {
    refreshUserDataAfterOperation,
    refreshUserData,
  };
};
