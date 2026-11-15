import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { getErrorMessage } from '../utils';

const emptyForm = { name: '', description: '' };

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories/');
      setCategories(res.data);
    } catch {
      setErrors({ general: 'Could not load categories.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fieldError = (name) =>
    errors[name] ? <p className="error">{[].concat(errors[name]).join(' ')}</p> : null;

  const startEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}/`, form);
      } else {
        await api.post('/categories/', form);
      }
      cancelEdit();
      loadCategories();
    } catch (err) {
      const data = err.response?.data;
      setErrors(data && typeof data === 'object' ? data : { general: 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await api.delete(`/categories/${category.id}/`);
      if (editingId === category.id) cancelEdit();
      loadCategories();
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete the category.'));
    }
  };

  return (
    <>
      <h1>Categories</h1>

      <form className="form-box" onSubmit={handleSubmit}>
        <h3 className="form-title">{editingId ? 'Edit Category' : 'Add Category'}</h3>
        {errors.general && <p className="error">{errors.general}</p>}
        {errors.detail && <p className="error">{errors.detail}</p>}

        <label>Category Name</label>
        <input name="name" value={form.name} onChange={change} required />
        {fieldError('name')}

        <label>Description</label>
        <textarea name="description" value={form.description} onChange={change} />
        {fieldError('description')}

        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Add Category'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>All Categories</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan="3">No categories yet. Add one above.</td></tr>
            )}
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description || '-'}</td>
                <td className="actions">
                  <button className="btn btn-small btn-secondary" onClick={() => startEdit(category)}>
                    Edit
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => deleteCategory(category)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}