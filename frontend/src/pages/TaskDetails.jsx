import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils';

export default function TaskDetails() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/tasks/${id}/`)
      .then((res) => setTask(res.data))
      .catch(() => setError('Could not load this task.'));
  }, [id]);

  const openDocument = async (download) => {
    // Open the tab first, so the browser does not block it as a popup
    const newTab = download ? null : window.open('', '_blank');
    try {
      const res = await api.get(`/tasks/${id}/document/`, {
        params: download ? { download: 1 } : {},
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);

      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = task.submission.filename || 'document';
        link.click();
      } else if (newTab) {
        newTab.location = url;
      }
    } catch {
      if (newTab) newTab.close();
      alert('Could not open the document.');
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!task) return <p>Loading...</p>;

  return (
    <>
      <div className="page-header">
        <h1>{task.title}</h1>
        <Link to="/tasks" className="btn btn-secondary">Back to Tasks</Link>
      </div>

      <h2>Task Information</h2>
      <div className="info-box">
        <div><strong>Category:</strong> {task.category_name}</div>
        <div>
          <strong>Assigned Staff:</strong>{' '}
          <Link to={`/staff/${task.staff}`}>{task.staff_name}</Link>
        </div>
        <div><strong>Assigned Date:</strong> {formatDate(task.created_at)}</div>
        <div><strong>Deadline:</strong> {formatDate(task.deadline)}</div>
        <div><strong>Status:</strong> <StatusBadge status={task.status} /></div>
      </div>

      <div className="info-box single">
        <div>
          <strong>Description</strong>
          <p className="pre-text">{task.description}</p>
        </div>
      </div>

      <h2>Submission Information</h2>
      {task.submission ? (
        <div className="info-box">
          <div><strong>Submitted on:</strong> {formatDate(task.submission.submitted_at)}</div>
          <div><strong>File:</strong> {task.submission.filename}</div>
          <div className="full-width">
            <strong>Comment</strong>
            <p className="pre-text">{task.submission.comment}</p>
          </div>
          <div className="actions full-width">
            <button className="btn" onClick={() => openDocument(false)}>View Document</button>
            <button className="btn btn-secondary" onClick={() => openDocument(true)}>Download Document</button>
          </div>
        </div>
      ) : (
        <p className="notice">
          {task.status === 'NOT_SUBMITTED'
            ? 'The deadline has passed and nothing was submitted.'
            : 'The staff member has not submitted this task yet.'}
        </p>
      )}
    </>
  );
}