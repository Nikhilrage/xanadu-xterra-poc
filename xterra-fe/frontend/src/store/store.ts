import { configureStore } from "@reduxjs/toolkit";
import contextReducer from "./contextSlice";
import toastReducer from "./toastSlice";

export const store = configureStore({
  reducer: {
    context: contextReducer,
    toast: toastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
