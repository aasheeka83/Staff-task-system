import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils';

const MAX_SIZE = 10 * 1024 * 1024;

export default function SubmitTask() {
  const { token } = useParams();
  const [task, setTask] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api
      .get(`/submit/${token}/`)
      .then((res) => setTask(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setLoadError('Could not load this task. Please try again later.');
      });
  }, [token]);

  const fieldError = (name) =>
    errors[name] ? <p className="error">{[].concat(errors[name]).join(' ')}</p> : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!file) {
      setErrors({ document: 'Please choose a file to upload.' });
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors({ document: 'File is too large. Maximum size is 10 MB.' });
      return;
    }

    const formData = new FormData();
    formData.append('comment', comment);
    formData.append('document', file);

    setSaving(true);
    try {
      await api.post(`/submit/${token}/`, formData);
      setDone(true);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data && typeof data === 'object' ? data : { detail: 'Could not submit. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  let content;

  if (notFound) {
    content = (
      <>
        <h1>Invalid Link</h1>
        <p>This submission link is not valid. Please use the link from your email.</p>
      </>
    );
  } else if (loadError) {
    content = <p className="error">{loadError}</p>;
  } else if (!task) {
    content = <p>Loading...</p>;
  } else {
    content = (
      <>
        <h1>{task.title}</h1>
        <p className="hint">Hello {task.staff_name}, this task has been assigned to you.</p>

        <div className="info-box single">
          <div><strong>Category:</strong> {task.category}</div>
          <div><strong>Assigned Date:</strong> {formatDate(task.assigned_date)}</div>
          <div><strong>Deadline:</strong> {formatDate(task.deadline)}</div>
          <div><strong>Status:</strong> <StatusBadge status={task.status} /></div>
          <div>
            <strong>Description</strong>
            <p className="pre-text">{task.description}</p>
          </div>
        </div>

        {done || task.status === 'COMPLETED' ? (
          <p className="success">
            {done ? 'Your task was submitted successfully. Thank you!' : 'This task has already been submitted.'}
          </p>
        ) : task.status === 'NOT_SUBMITTED' ? (
          <p className="notice">The deadline has passed. This task can no longer be submitted.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Submit your work</h2>
            {errors.detail && <p className="error">{errors.detail}</p>}

            <label>Submission Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
            {fieldError('comment')}

            <label>Upload Document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            <p className="hint">Allowed: PDF, Word, Excel, PNG, JPG, TXT. Maximum size 10 MB.</p>
            {fieldError('document')}

            <button className="btn full" type="submit" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Task'}
            </button>
          </form>
        )}
      </>
    );
  }

  return (
    <div className="public-page">
      <div className="public-box">{content}</div>
    </div>
  );
}