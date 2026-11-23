import React, { useState, useEffect } from 'react';
import { addExpense, updateExpense, addCategory } from '../services/api';
import './ExpenseForm.css';

const today = new Date().toISOString().split('T')[0];

const initialForm = {
  title: '',
  amount: '',
  date: today,
  categoryId: '',
  description: '',
};

function ExpenseForm({ categories, initialData = null, onAdd, onRefreshCategories, onClose }) {
  const isEditing = Boolean(initialData && initialData.id);

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        title: initialData.title || '',
        amount: initialData.amount ? String(initialData.amount) : '',
        date: initialData.date || today,
        categoryId: initialData.categoryId ? String(initialData.categoryId) : '',
        description: initialData.description || '',
      };
    }
    return initialForm;
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        amount: initialData.amount ? String(initialData.amount) : '',
        date: initialData.date || today,
        categoryId: initialData.categoryId ? String(initialData.categoryId) : '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inline Category states
  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6c63ff');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleCreateCategoryInline = async () => {
    if (!newCatName.trim()) {
      setError('Please enter a category name.');
      return;
    }
    setCreatingCategory(true);
    setError('');
    try {
      const res = await addCategory({ name: newCatName.trim(), color: newCatColor });
      const newCat = res.data;
      if (onRefreshCategories) {
        await onRefreshCategories();
      }
      setForm((prev) => ({ ...prev, categoryId: String(newCat.id) }));
      setNewCatName('');
      setShowInlineCategory(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create category.';
      setError(typeof msg === 'string' ? msg : 'Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.title.trim()) {
      setError('Please enter a title for the expense.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!form.date) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        date: form.date,
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
        description: form.description.trim(),
      };
      if (isEditing) {
        await updateExpense(initialData.id, payload);
      } else {
        await addExpense(payload);
      }
      onAdd();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        (isEditing ? 'Failed to update expense. Please try again.' : 'Failed to add expense. Please try again.');
      setError(typeof msg === 'string' ? msg : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-strong scale-in">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <span>{isEditing ? '✏️' : '➕'}</span>
              <span>{isEditing ? 'Edit Expense' : 'Add New Expense'}</span>
            </h2>
            <p className="modal-subtitle">
              {isEditing ? 'Update spending or reassign category' : 'Record your spending details'}
            </p>
          </div>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="expense-form">
          {/* Title + Amount */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Expense Title *</label>
              <div className="input-with-icon">
                <span className="input-icon">📝</span>
                <input
                  className="input"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Grocery Shopping"
                  maxLength={100}
                  autoFocus
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Amount (₹) *</label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  className="input"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
              </div>
            </div>
          </div>

          {/* Date + Category */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Date *</label>
              <div className="input-with-icon">
                <span className="input-icon">📅</span>
                <input
                  className="input"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label className="input-label" style={{ margin: 0 }}>Category</label>
                <span 
                  className="inline-add-cat-btn" 
                  onClick={() => setShowInlineCategory(!showInlineCategory)}
                >
                  {showInlineCategory ? '✕ Cancel' : '➕ New'}
                </span>
              </div>
              
              <div className="input-with-icon">
                <span className="input-icon">🏷️</span>
                <select
                  className="input"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inline Category Creation Subform */}
            {showInlineCategory && (
              <div className="inline-category-form">
                <div className="inline-cat-header">
                  <span>🏷️</span>
                  <span>Create Category Inline</span>
                </div>
                <div className="inline-cat-row">
                  <input
                    className="input"
                    type="text"
                    placeholder="Name (e.g. Travel)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    maxLength={30}
                    style={{ flex: 1 }}
                  />
                  <div className="inline-cat-color-preview" style={{ background: newCatColor }}>
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="inline-cat-color-picker"
                      title="Choose Color"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleCreateCategoryInline}
                    disabled={creatingCategory}
                  >
                    {creatingCategory ? 'Saving...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label">Description (optional)</label>
            <textarea
              className="input"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add any extra notes about this expense..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Category color preview */}
          {!showInlineCategory && form.categoryId && (() => {
            const cat = categories.find((c) => String(c.id) === String(form.categoryId));
            return cat ? (
              <div className="form-category-preview">
                <span
                  className="form-category-dot"
                  style={{ background: cat.color || '#6c63ff' }}
                />
                <span>Category: <strong>{cat.name}</strong></span>
              </div>
            ) : null;
          })()}

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>{isEditing ? 'Saving...' : 'Adding...'}</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{isEditing ? 'Save Changes' : 'Add Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;
