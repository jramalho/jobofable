import { createBrowserRouter } from 'react-router-dom';
import { AnalysesPage } from '../pages/AnalysesPage';
import { ApplicationDetailPage } from '../pages/ApplicationDetailPage';
import { ApplicationsListPage } from '../pages/ApplicationsListPage';
import { HomePage } from '../pages/HomePage';
import { NewAnalysisPage } from '../pages/NewAnalysisPage';
import { NewApplicationPage } from '../pages/NewApplicationPage';
import { ResultPage } from '../pages/ResultPage';

export const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/new-analysis', element: <NewAnalysisPage /> },
    { path: '/analyses', element: <AnalysesPage /> },
    { path: '/result/:analysisId', element: <ResultPage /> },
    { path: '/applications', element: <ApplicationsListPage /> },
    { path: '/applications/new', element: <NewApplicationPage /> },
    { path: '/applications/:id', element: <ApplicationDetailPage /> },
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
