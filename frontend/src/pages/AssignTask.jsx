import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const emptyForm = {
  title: '',
  category: '',
  description: '',
  deadline: '',
  staff: '',
};

export default function AssignTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/categories/'), api.get('/staff/')])
      .then(([categoryRes, staffRes]) => {
        setCategories(categoryRes.data);
        setStaffList(staffRes.data.filter((member) => member.is_active));
      })
      .catch(() => setErrors({ general: 'Could not load staff and categories.' }))
      .finally(() => setLoading(false));
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fieldError = (name) =>
    errors[name] ? <p className="error">{[].concat(errors[name]).join(' ')}</p> : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      staff: form.staff,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : '',
    };

    try {
      const res = await api.post('/tasks/', payload);
      navigate(`/tasks/${res.data.id}`);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data && typeof data === 'object' ? data : { general: 'Could not create the task.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  const missingData = categories.length === 0 || staffList.length === 0;

  return (
    <>
      <h1>Assign Task</h1>

      {missingData && (
        <p className="notice">
          You need at least one <Link to="/categories">category</Link> and one active{' '}
          <Link to="/staff">staff member</Link> before you can assign a task.
        </p>
      )}

      <form className="form-box" onSubmit={handleSubmit}>
        {errors.general && <p className="error">{errors.general}</p>}

        <label>Task Title</label>
        <input name="title" value={form.title} onChange={change} required />
        {fieldError('title')}

        <label>Task Category</label>
        <select name="category" value={form.category} onChange={change} required>
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        {fieldError('category')}

        <label>Task Description</label>
        <textarea name="description" value={form.description} onChange={change} required />
        {fieldError('description')}

        <label>Task Deadline</label>
        <input name="deadline" type="datetime-local" value={form.deadline} onChange={change} required />
        {fieldError('deadline')}

        <label>Select Staff</label>
        <select name="staff" value={form.staff} onChange={change} required>
          <option value="">Select a staff member</option>
          {staffList.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name} ({member.email})
            </option>
          ))}
        </select>
        {fieldError('staff')}

        <p className="hint">
          The status is set to Pending automatically, and an email with the submission link is sent to the staff member.
        </p>

        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving || missingData}>
            {saving ? 'Assigning...' : 'Assign Task'}
          </button>
          <Link to="/tasks" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </>
  );
}