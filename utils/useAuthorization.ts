import { useEffect, useMemo, useState } from 'react';
import {
  AppPermission,
  AppRole,
  getRoleLabel,
  hasPermission,
  readRoleFromUserProfile,
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT
} from './permissions';

interface UseAuthorizationResult {
  role: AppRole;
  roleLabel: string;
  can: (permission: AppPermission | readonly AppPermission[]) => boolean;
}

export const useAuthorization = (): UseAuthorizationResult => {
  const [role, setRole] = useState<AppRole>(() => readRoleFromUserProfile());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshRole = () => {
      setRole(readRoleFromUserProfile());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== USER_PROFILE_STORAGE_KEY) return;
      refreshRole();
    };

    const handleProfileUpdated = () => {
      refreshRole();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);

    refreshRole();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
    };
  }, []);

  const can = (permission: AppPermission | readonly AppPermission[]) =>
    hasPermission(role, permission);

  return useMemo(
    () => ({
      role,
      roleLabel: getRoleLabel(role),
      can
    }),
    [role]
  );
};

