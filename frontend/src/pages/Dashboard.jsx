import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils';

const cards = [
  ['total_tasks', 'Total Tasks'],
  ['pending_tasks', 'Pending Tasks'],
  ['completed_tasks', 'Completed Tasks'],
  ['not_submitted_tasks', 'Not Submitted'],
  ['overdue_tasks', 'Overdue Tasks'],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load the dashboard.'));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
      <h1>Dashboard</h1>
      <div className="cards">
        {cards.map(([key, label]) => (
          <div className="card" key={key}>
            <div className="card-number">{data[key]}</div>
            <div className="card-label">{label}</div>
          </div>
        ))}
      </div>

      <h2>Recent Tasks</h2>
      <table>
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Category</th>
            <th>Assigned Staff</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.recent_tasks.length === 0 && (
            <tr><td colSpan="6">No tasks yet.</td></tr>
          )}
          {data.recent_tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.category_name}</td>
              <td>{task.staff_name}</td>
              <td>{formatDate(task.deadline)}</td>
              <td><StatusBadge status={task.status} /></td>
              <td>
                <Link to={`/tasks/${task.id}`} className="btn btn-small btn-secondary">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}