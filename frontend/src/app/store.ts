import { configureStore } from '@reduxjs/toolkit';
import { analysisApi } from '../features/analysis/api/analysisApi';
import { analysisReducer } from '../features/analysis/slices/analysisSlice';

export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
    [analysisApi.reducerPath]: analysisApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // FormData (mutation arg) and Blob (export results) are not serializable by design.
        ignoredActions: [
          'analysisApi/executeMutation/pending',
          'analysisApi/executeMutation/fulfilled',
          'analysisApi/executeMutation/rejected',
        ],
        ignoredPaths: ['analysisApi'],
      },
    }).concat(analysisApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
