import { api } from "./apiClient";
import type { Address } from "@/types";

// Where the backend mounts user.routes.ts (see app.ts). apiClient already
// prepends /api, so this is the only place to change if it isn't "/users".
const USERS = "/users";

export interface AccountProfile {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
}

export interface AddressInput {
  label: string;
  building?: string;
  street?: string;
  area?: string;
  city?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export const account = {
  updateProfile: (fullName: string) => api.patch<AccountProfile>(`${USERS}/me`, { fullName }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>(`${USERS}/me/password`, { currentPassword, newPassword }),

  revokeOtherSessions: () => api.post<{ message: string }>(`${USERS}/me/sessions/revoke-others`),

  startEmailChange: (newEmail: string, password: string) =>
    api.post<{ message: string }>(`${USERS}/me/email/start`, { newEmail, password }),

  verifyEmailChange: (code: string) => api.post<AccountProfile>(`${USERS}/me/email/verify`, { code }),

  deleteAccount: (password: string) => api.post<{ deleted: boolean }>(`${USERS}/me/delete`, { password }),

  listAddresses: () => api.get<Address[]>(`${USERS}/me/addresses`),
  createAddress: (input: AddressInput) => api.post<Address>(`${USERS}/me/addresses`, input),
  setDefaultAddress: (id: string) => api.patch<Address>(`${USERS}/me/addresses/${id}`, { isDefault: true }),
  deleteAddress: (id: string) => api.delete<{ deleted: boolean }>(`${USERS}/me/addresses/${id}`),
};
