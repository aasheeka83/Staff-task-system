import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AssignTask from './pages/AssignTask';
import CategoryList from './pages/CategoryList';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import StaffDetails from './pages/StaffDetails';
import StaffForm from './pages/StaffForm';
import StaffList from './pages/StaffList';
import SubmitTask from './pages/SubmitTask';
import TaskDetails from './pages/TaskDetails';
import TaskList from './pages/TaskList';

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/submit/:token" element={<SubmitTask />} />

      {/* Admin pages (login required) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/staff" element={<StaffList />} />
          <Route path="/staff/new" element={<StaffForm />} />
          <Route path="/staff/:id" element={<StaffDetails />} />
          <Route path="/staff/:id/edit" element={<StaffForm />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/assign-task" element={<AssignTask />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}