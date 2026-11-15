import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils';

const tabs = [
  ['all', 'All'],
  ['PENDING', 'Pending'],
  ['COMPLETED', 'Completed'],
  ['NOT_SUBMITTED', 'Not Submitted'],
  ['OVERDUE', 'Overdue'],
];

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      const params = { search };
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/tasks/', { params });
      setTasks(res.data);
      setError('');
    } catch {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(loadTasks, 300);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  return (
    <>
      <div className="page-header">
        <h1>Tasks</h1>
        <Link to="/assign-task" className="btn">+ Assign Task</Link>
      </div>

      <div className="tabs">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={`tab ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by task title, staff or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Category</th>
              <th>Assigned Staff</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr><td colSpan="7">No tasks found.</td></tr>
            )}
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.category_name}</td>
                <td>{task.staff_name}</td>
                <td>{formatDate(task.deadline)}</td>
                <td><StatusBadge status={task.status} /></td>
                <td>{formatDate(task.created_at)}</td>
                <td>
                  <Link to={`/tasks/${task.id}`} className="btn btn-small btn-secondary">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}