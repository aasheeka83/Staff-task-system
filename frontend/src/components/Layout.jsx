import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Task Manager</h2>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/staff">Staff</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/assign-task">Assign Task</NavLink>
          <NavLink to="/tasks">Tasks</NavLink>
        </nav>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}