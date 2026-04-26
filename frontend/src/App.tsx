// src/App.tsx
// Root component — sets up React Router routes

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { PrivateRoute } from './components/PrivateRoute';

// Search page coming in Module 7 — placeholder for now
function SearchPlaceholder() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h2>Search Page — Module 7</h2>
      <p>Auth is working! Search UI coming next.</p>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchPlaceholder />
            </PrivateRoute>
          }
        />
        {/* Redirect root and any unknown route to /search */}
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </BrowserRouter>
  );
}