import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BudgetTable from './pages/BudgetTable';

function App() {
  return (
    <Router>
      <nav className="nav-bar">
        <div className="text-xl font-bold tracking-tight">Planova</div>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/budget" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Budget Plan</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/budget" element={<BudgetTable />} />
      </Routes>
    </Router>
  );
}

export default App;
