import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  AppPermission,
  AppRole,
  getRoleLabel,
  hasPermission,
  readRoleFromUserProfile,
  resolveRole,
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT
} from './permissions';
import {
  ACTIVE_COMPANY_STORAGE_KEY,
  ACTIVE_COMPANY_UPDATED_EVENT,
  readStoredActiveCompanyId,
  saveActiveCompanyId
} from './tenant';

interface UseAuthorizationResult {
  role: AppRole;
  roleLabel: string;
  activeCompanyId: string | null;
  can: (permission: AppPermission | readonly AppPermission[]) => boolean;
}

export const useAuthorization = (): UseAuthorizationResult => {
  const [role, setRole] = useState<AppRole>(() => readRoleFromUserProfile());
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() =>
    readStoredActiveCompanyId()
  );
  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  const refreshRole = useCallback(async () => {
    const fallbackRole = readRoleFromUserProfile();
    const fallbackCompanyId = readStoredActiveCompanyId();

    if (!hasSupabaseConfig) {
      setRole(fallbackRole);
      setActiveCompanyId(fallbackCompanyId);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      setRole(fallbackRole);
      setActiveCompanyId(fallbackCompanyId);
      return;
    }

    const userId = sessionData.session.user.id;
    const { data: rows, error } = await supabase
      .from('company_users')
      .select('company_id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !Array.isArray(rows) || rows.length === 0) {
      setRole(fallbackRole);
      setActiveCompanyId(fallbackCompanyId);
      return;
    }

    const memberships = rows.filter(
      (row: any) =>
        typeof row?.company_id === 'string' &&
        row.company_id.trim().length > 0 &&
        typeof row?.role === 'string'
    ) as Array<{ company_id: string; role: string }>;

    if (!memberships.length) {
      setRole(fallbackRole);
      setActiveCompanyId(fallbackCompanyId);
      return;
    }

    const storedCompanyId = readStoredActiveCompanyId();
    const selected =
      memberships.find((membership) => membership.company_id === storedCompanyId) ||
      memberships[0];

    const normalizedCompanyId = saveActiveCompanyId(selected.company_id);
    setActiveCompanyId(normalizedCompanyId);
    setRole(resolveRole(selected.role));
  }, [hasSupabaseConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;

    const sync = async () => {
      await refreshRole();
      if (!mounted) return;
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key &&
        event.key !== USER_PROFILE_STORAGE_KEY &&
        event.key !== ACTIVE_COMPANY_STORAGE_KEY
      ) {
        return;
      }

      void sync();
    };

    const handleProfileUpdated = () => {
      void sync();
    };

    const handleActiveCompanyUpdated = () => {
      void sync();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
    window.addEventListener(
      ACTIVE_COMPANY_UPDATED_EVENT,
      handleActiveCompanyUpdated as EventListener
    );

    const { data: authListener } = hasSupabaseConfig
      ? supabase.auth.onAuthStateChange(() => {
          void sync();
        })
      : { data: null as any };

    void sync();

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
      window.removeEventListener(
        ACTIVE_COMPANY_UPDATED_EVENT,
        handleActiveCompanyUpdated as EventListener
      );

      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [hasSupabaseConfig, refreshRole]);

  const can = (permission: AppPermission | readonly AppPermission[]) =>
    hasPermission(role, permission);

  return useMemo(
    () => ({
      role,
      roleLabel: getRoleLabel(role),
      activeCompanyId,
      can
    }),
    [role, activeCompanyId]
  );
};
