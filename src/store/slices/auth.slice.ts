import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser, AuthStatus } from "@/types/auth";

export interface AuthState {
  admin: AdminUser | null;
  status: AuthStatus;
  sessionNotice: string | null;
}

const initialState: AuthState = {
  admin: null,
  status: "idle",
  sessionNotice: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading(state) {
      if (state.status === "idle") {
        state.status = "loading";
      }
    },
    setAuthenticatedAdmin(state, action: PayloadAction<AdminUser>) {
      state.admin = action.payload;
      state.status = "authenticated";
      state.sessionNotice = null;
    },
    clearAuthSession(state, action: PayloadAction<string | null | undefined>) {
      state.admin = null;
      state.status = "unauthenticated";
      if (action.payload !== undefined) {
        state.sessionNotice = action.payload;
      }
    },
    dismissSessionNotice(state) {
      state.sessionNotice = null;
    },
  },
});

export const {
  setAuthLoading,
  setAuthenticatedAdmin,
  clearAuthSession,
  dismissSessionNotice,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
