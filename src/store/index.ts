import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/store/slices/auth.slice";
import { uiReducer } from "@/store/slices/ui.slice";

/**
 * Store factory for Next.js App Router so each client tree receives an isolated
 * Redux store instance with no cross-request shared mutable state.
 */
export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
