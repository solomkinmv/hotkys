"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-provider";
import { userService } from "@/lib/services/user-service";
import { customizationsService } from "@/lib/services/customizations-service";
import { favoritesService } from "@/lib/services/favorites-service";
import type { UserPreferences, UserProfile, UserCustomizations, Favorite } from "@/lib/model/user/user-models";
export const defaultPreferences: UserPreferences = { platformFilter: null, viewMode: "list", columnCount: 4 };
const emptyCustomizations: UserCustomizations = { customApps: [], customKeymaps: [], shortcuts: [], favorites: [] };
type Data = { preferences: UserPreferences; profile: UserProfile | null; customizations: UserCustomizations; favorites: Favorite[] };
type Resource = keyof Data;
interface AccountData { data: Data; loading: boolean; errors: Partial<Record<Resource, string>>; refetch(): Promise<void>; updatePreferences(patch: Partial<UserPreferences>): Promise<void>; updateProfile(patch: Pick<UserProfile, "displayName" | "avatarUrl">): Promise<void>; removeFavorite(id: string): Promise<void>; addFavorite(favorite: Omit<Favorite, "id" | "userId">): Promise<void> }
const Context = createContext<AccountData | null>(null);
export function AccountDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<Data>({ preferences: defaultPreferences, profile: null, customizations: emptyCustomizations, favorites: [] });
  const [loading, setLoading] = useState(Boolean(user));
  const [errors, setErrors] = useState<AccountData["errors"]>({});
  const active = useRef(true);
  const revision = useRef(0);
  const pending = useRef<Promise<void> | null>(null);
  const preferences = useRef(defaultPreferences);
  const writes = useRef(Promise.resolve());
  const preferenceRevision = useRef(0);
  const preferencesLoaded = useRef(!user);
  const [failedPreferenceWrite, setFailedPreferenceWrite] = useState(false);
  useEffect(() => { const version = revision; const request = pending; active.current = true; return () => { active.current = false; version.current++; request.current = null; }; }, []);
  const refetch = useCallback((): Promise<void> => {
    if (!user) return Promise.resolve();
    if (pending.current) return pending.current;
    const generation = ++revision.current;
    const prefVersion = preferenceRevision.current;
    setLoading(true);
    const jobs = {
      preferences: async () => { await writes.current; return await userService.getPreferences(user) ?? defaultPreferences; },
      profile: () => userService.getProfile(user),
      customizations: () => customizationsService.getAllCustomizations(user),
      favorites: () => favoritesService.getFavorites(user),
    };
    const promise = Promise.all((Object.keys(jobs) as Resource[]).map(async resource => {
      try {
        const value = await jobs[resource]();
        if (!active.current || revision.current !== generation) return;
        if (resource === "preferences" && preferenceRevision.current !== prefVersion) return;
        if (resource === "preferences") { preferences.current = value as UserPreferences; preferencesLoaded.current = true; }
        setData(previous => ({ ...previous, [resource]: value }));
        setErrors(previous => ({ ...previous, [resource]: undefined }));
      } catch (error) {
        if (active.current && revision.current === generation) setErrors(previous => ({ ...previous, [resource]: message(error) }));
      }
    })).then(() => {}).finally(() => {
      if (pending.current === promise) pending.current = null;
      if (active.current && revision.current === generation) setLoading(false);
    });
    pending.current = promise;
    return promise;
  }, [user]);
  useEffect(() => { void refetch(); }, [refetch]);
  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    if (!preferencesLoaded.current) return Promise.reject(new Error("Load your saved preferences before changing them. Please retry sync."));
    preferences.current = { ...preferences.current, ...patch };
    preferenceRevision.current++;
    setData(previous => ({ ...previous, preferences: preferences.current }));
    const next = { ...preferences.current };
    const operation = writes.current.catch(() => {}).then(async () => {
      if (!active.current) return;
      if (user) await userService.updatePreferences(next, user);
      if (active.current) { setFailedPreferenceWrite(false); setErrors(previous => ({ ...previous, preferences: undefined })); }
    }).catch(error => {
      if (active.current) { setFailedPreferenceWrite(true); setErrors(previous => ({ ...previous, preferences: message(error) })); }
      throw error;
    });
    writes.current = operation;
    return operation;
  }, [user]);
  const mutate = async (resource: Resource, operation: () => Promise<unknown>) => {
    try {
      await operation();
      if (!active.current) return;
      if (pending.current) await pending.current;
      if (active.current) await refetch();
    } catch (error) {
      if (active.current) setErrors(previous => ({ ...previous, [resource]: message(error) }));
      throw error;
    }
  };
  return <Context.Provider value={{ data, loading, errors, refetch, updatePreferences,
    updateProfile: patch => mutate("profile", () => userService.updateProfile(patch, user)),
    removeFavorite: id => mutate("favorites", () => favoritesService.removeFavorite(id, user)),
    addFavorite: favorite => mutate("favorites", () => favoritesService.addFavorite(favorite, user)),
  }}>
    {Object.entries(errors).filter(([, error]) => error).map(([resource, error]) => <div key={resource} role="alert" className="border-b px-4 py-2 text-sm">
      {resource}: {error} <button type="button" className="underline" onClick={() => { void (resource === "preferences" && failedPreferenceWrite ? updatePreferences({}) : refetch()).catch(() => {}); }}>Retry</button>
    </div>)}
    {children}</Context.Provider>;
}
function message(error: unknown) { return error instanceof Error ? error.message : "Private data could not sync. Please retry."; }
export function useAccountData() { const context = useContext(Context); if (!context) throw new Error("AccountDataProvider is missing"); return context; }
