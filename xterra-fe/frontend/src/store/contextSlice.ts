import { createSlice } from "@reduxjs/toolkit";

interface ContextState {
  currentContext: any | null;
}

const initialState: ContextState = {
  currentContext: localStorage.getItem("current_context")
    ? JSON.parse(localStorage.getItem("current_context")!)
    : {
        type: "admin",
      },
};

const contextSlice = createSlice({
  name: "context",
  initialState,
  reducers: {
    setContext: (state, action) => {
      state.currentContext = action.payload;

      localStorage.setItem("current_context", JSON.stringify(action.payload));
    },

    clearContext: (state) => {
      state.currentContext = {
        type: "admin",
      };

      localStorage.removeItem("current_context");
    },
  },
});

export const { setContext, clearContext } = contextSlice.actions;

export default contextSlice.reducer;
