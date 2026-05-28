import React, { useState, useMemo } from 'react';
import CategoryBadge from './CategoryBadge';
import './ExpenseList.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function ExpenseList({ expenses = [], categories = [], onDelete }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Build category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  // Filtered expenses
  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      const matchSearch =
        !search ||
        exp.title?.toLowerCase().includes(search.toLowerCase()) ||
        exp.description?.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        !filterCategory || String(exp.categoryId) === String(filterCategory);

      const expDate = exp.date ? new Date(exp.date) : null;
      const matchFrom = !filterDateFrom || (expDate && expDate >= new Date(filterDateFrom));
      const matchTo = !filterDateTo || (expDate && expDate <= new Date(filterDateTo + 'T23:59:59'));

      return matchSearch && matchCategory && matchFrom && matchTo;
    });
  }, [expenses, search, filterCategory, filterDateFrom, filterDateTo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasFilters = search || filterCategory || filterDateFrom || filterDateTo;

  return (
    <div className="expense-list-wrapper">
      {/* Filter Bar */}
      <div className="filter-bar glass">
        <div className="filter-bar-main">
          {/* Search */}
          <div className="input-with-icon filter-search">
            <span className="input-icon">🔍</span>
            <input
              className="input"
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <select
            className="input filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            className="input filter-date"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            title="From date"
            style={{ colorScheme: 'dark' }}
          />
          <input
            className="input filter-date"
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            title="To date"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Filter meta */}
        <div className="filter-meta">
          <span className="filter-count">
            {filtered.length} of {expenses.length} expenses
          </span>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Expense Table */}
      {filtered.length === 0 ? (
        <div className="expense-empty glass">
          <div className="expense-empty-icon">
            {hasFilters ? '🔍' : '💸'}
          </div>
          <h3 className="expense-empty-title">
            {hasFilters ? 'No results found' : 'No expenses yet'}
          </h3>
          <p className="expense-empty-text">
            {hasFilters
              ? 'Try adjusting your filters to see more results.'
              : 'Start tracking your expenses by clicking "Add Expense" above.'}
          </p>
          {hasFilters && (
            <button className="btn btn-outline btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="expense-table-wrapper glass">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp, idx) => {
                  const cat = categoryMap[exp.categoryId];
                  return (
                    <tr
                      key={exp.id}
                      className="expense-row"
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <td>
                        <div className="expense-title-cell">
                          <div
                            className="expense-color-dot"
                            style={{ background: cat?.color || 'var(--accent-primary)' }}
                          />
                          <div>
                            <div className="expense-title">{exp.title}</div>
                            {exp.description && (
                              <div className="expense-desc">{exp.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {cat ? (
                          <CategoryBadge name={cat.name} color={cat.color} />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="expense-date">{formatDate(exp.date)}</td>
                      <td className="expense-amount">{formatCurrency(exp.amount)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          title="Delete expense"
                        >
                          {deletingId === exp.id ? (
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                          ) : (
                            '🗑️'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="expense-cards">
            {filtered.map((exp, idx) => {
              const cat = categoryMap[exp.categoryId];
              return (
                <div
                  key={exp.id}
                  className="expense-card glass"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="expense-card-left">
                    <div
                      className="expense-color-dot"
                      style={{
                        background: cat?.color || 'var(--accent-primary)',
                        width: 10,
                        height: 10,
                      }}
                    />
                    <div>
                      <div className="expense-title">{exp.title}</div>
                      {exp.description && (
                        <div className="expense-desc">{exp.description}</div>
                      )}
                      <div className="expense-card-meta">
                        {cat && <CategoryBadge name={cat.name} color={cat.color} />}
                        <span className="expense-date">{formatDate(exp.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="expense-card-right">
                    <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                    >
                      {deletingId === exp.id ? (
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                      ) : (
                        '🗑️'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ExpenseList;
