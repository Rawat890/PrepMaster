import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from './authService.js';

export const registerUser = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
  try { return (await authService.register(formData)).user; }
  catch (error) { return rejectWithValue({ message: error.message, errors: error.errors }); }
});

export const loginUser = createAsyncThunk('auth/login', async (formData, { rejectWithValue }) => {
  try { return (await authService.login(formData)).user; }
  catch (error) { return rejectWithValue({ message: error.message, errors: error.errors }); }
});

export const fetchCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { return (await authService.getCurrentUser()).user; }
  catch (error) { return rejectWithValue(error.message); }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try { await authService.logout(); return true; }
  catch (error) { return rejectWithValue(error.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', initialized: false, error: null },
  reducers: { clearAuthError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => { state.user = action.payload; state.status = 'succeeded'; state.initialized = true; })
      .addCase(fetchCurrentUser.rejected, (state) => { state.user = null; state.status = 'idle'; state.initialized = true; })
      .addCase(registerUser.fulfilled, (state, action) => { state.user = action.payload; state.status = 'succeeded'; state.error = null; state.initialized = true; })
      .addCase(loginUser.fulfilled, (state, action) => { state.user = action.payload; state.status = 'succeeded'; state.error = null; state.initialized = true; })
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; state.status = 'idle'; state.error = null; })
      .addCase(logoutUser.rejected, (state) => { state.user = null; state.status = 'idle'; })
      .addMatcher((action) => [registerUser.rejected.type, loginUser.rejected.type].includes(action.type), (state, action) => { state.error = action.payload?.message || 'Unable to authenticate.'; state.status = 'idle'; })
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
