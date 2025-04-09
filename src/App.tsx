import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './componets/sidebar';
import Home from './componets/home';
import LoginPage from './componets/loginPage';
import { isAuthenticated } from './service/authService';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route
            path="home"
            element={
              isAuthenticated() ? <Home />: <Navigate to="/login" replace />
            }
          />
        </Route>

        {/* Default route */}
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </Router>
  );
};

export default App;
