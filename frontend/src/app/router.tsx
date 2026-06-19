import { createBrowserRouter } from 'react-router-dom';
import { AnalysesPage } from '../pages/AnalysesPage';
import { HomePage } from '../pages/HomePage';
import { NewAnalysisPage } from '../pages/NewAnalysisPage';
import { ResultPage } from '../pages/ResultPage';

export const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/new-analysis', element: <NewAnalysisPage /> },
    { path: '/analyses', element: <AnalysesPage /> },
    { path: '/result/:analysisId', element: <ResultPage /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
