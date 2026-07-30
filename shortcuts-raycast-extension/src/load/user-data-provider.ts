import { showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useCallback } from "react";
import { getAccessToken } from "../auth/session";
import type { FavoriteIdentifier } from "../user-data/favorites";
import type { UserDataState } from "../user-data/service";
import { userDataService } from "../user-data/service";

async function loadUserData(allowAuthorization: boolean): Promise<UserDataState | null> {
  const accessToken = await getAccessToken(allowAuthorization);
  return accessToken ? userDataService.load(accessToken) : null;
}

export function useUserData(allowAuthorization = false) {
  const state = usePromise(loadUserData, [allowAuthorization], {
    failureToastOptions: {
      title: "Failed to sync Hotkys account",
    },
  });

  const toggleFavorite = useCallback(
    async (identifier: FavoriteIdentifier) => {
      const accessToken = await getAccessToken(true);
      if (!accessToken) {
        throw new Error("Hotkys sign in did not return an access token.");
      }

      const added = await userDataService.toggleFavorite(accessToken, identifier);
      await state.revalidate();
      await showToast({
        style: Toast.Style.Success,
        title: added ? "Added to favorites" : "Removed from favorites",
      });
    },
    [state]
  );

  return {
    ...state,
    toggleFavorite,
  };
}
