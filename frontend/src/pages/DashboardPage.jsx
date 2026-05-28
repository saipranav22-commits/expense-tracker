import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, Line
} from 'recharts';
import Navbar from '../components/Navbar';
import SummaryCard from '../components/SummaryCard';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import CategoryBadge from '../components/CategoryBadge';
import {
  getExpenses,
  getMonthlySummary,
  deleteExpense,
  getCategories,
  addCategory,
  deleteCategory,
  // New API functions
  getBudgets,
  setBudget,
  deleteBudget,
  getRecurringExpenses,
  createRecurringExpense,
  toggleRecurringExpense,
  deleteRecurringExpense,
  getInsights
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

const CHART_COLORS = [
  '#6c63ff', '#48cae4', '#2ed573', '#ffa502',
  '#ff4757', '#ff6b81', '#a29bfe', '#74b9ff',
  '#fd79a8', '#55efc4', '#fdcb6e', '#e17055',
];

// Custom dark tooltip for bar/area chart
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">{label}</p>
      <p className="value">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

// Custom dark tooltip for pie chart
const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="label">{payload[0]?.name}</p>
      <p className="value">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

// Custom pie legend
const renderPieLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="pie-legend">
      {payload.map((entry, idx) => (
        <li key={idx} className="pie-legend-item">
          <span
            className="pie-legend-dot"
            style={{ background: entry.color }}
          />
          <span className="pie-legend-name">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

// Greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDisplayDate = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

function DashboardPage() {
  const { user } = useAuth();

  // State
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // New States for expanded features
  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loadingRecurring, setLoadingRecurring] = useState(true);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  // Budget form state
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCatId, setBudgetCatId] = useState('');
  const [settingBudget, setSettingBudget] = useState(false);

  // Recurring form state
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFrequency, setRecFrequency] = useState('MONTHLY');
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recCatId, setRecCatId] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [creatingRecurring, setCreatingRecurring] = useState(false);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6c63ff');
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState(null);

  // ===== DATA FETCHING =====
  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    setExpenseError('');
    try {
      const res = await getExpenses();
      const data = Array.isArray(res.data) ? res.data : res.data?.content || res.data?.expenses || [];
      setExpenses(data);
    } catch (err) {
      setExpenseError('Failed to load expenses.');
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await getCategories();
      const data = Array.isArray(res.data) ? res.data : res.data?.categories || [];
      setCategories(data);
    } catch (err) {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchMonthlySummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await getMonthlySummary();
      setMonthlySummary(res.data || {});
    } catch (err) {
      setMonthlySummary({});
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const res = await getBudgets();
      setBudgets(res.data || []);
    } catch (err) {
      setBudgets([]);
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  const fetchRecurringExpenses = useCallback(async () => {
    setLoadingRecurring(true);
    try {
      const res = await getRecurringExpenses();
      setRecurringExpenses(res.data || []);
    } catch (err) {
      setRecurringExpenses([]);
    } finally {
      setLoadingRecurring(false);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const res = await getInsights();
      setInsights(res.data || []);
    } catch (err) {
      setInsights([]);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchMonthlySummary();
    fetchBudgets();
    fetchRecurringExpenses();
    fetchInsights();
  }, [fetchExpenses, fetchCategories, fetchMonthlySummary, fetchBudgets, fetchRecurringExpenses, fetchInsights]);

  // ===== EXPENSE HANDLERS =====
  const handleAddExpense = useCallback(() => {
    fetchExpenses();
    fetchMonthlySummary();
    fetchBudgets();
    fetchInsights();
  }, [fetchExpenses, fetchMonthlySummary, fetchBudgets, fetchInsights]);

  const handleDeleteExpense = useCallback(async (id) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    fetchMonthlySummary();
    fetchBudgets();
    fetchInsights();
  }, [fetchMonthlySummary, fetchBudgets, fetchInsights]);

  // ===== BUDGET HANDLERS =====
  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetAmount || Number(budgetAmount) <= 0) return;
    setSettingBudget(true);
    try {
      await setBudget({
        amount: parseFloat(budgetAmount),
        categoryId: budgetCatId ? parseInt(budgetCatId, 10) : null
      });
      setBudgetAmount('');
      setBudgetCatId('');
      fetchBudgets();
      fetchInsights();
    } catch (err) {
      alert('Failed to set budget target.');
    } finally {
      setSettingBudget(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await deleteBudget(id);
      fetchBudgets();
      fetchInsights();
    } catch (err) {
      alert('Failed to delete budget.');
    }
  };

  // ===== RECURRING EXPENSE HANDLERS =====
  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    if (!recTitle.trim() || !recAmount || Number(recAmount) <= 0) return;
    setCreatingRecurring(true);
    try {
      await createRecurringExpense({
        title: recTitle.trim(),
        amount: parseFloat(recAmount),
        frequency: recFrequency,
        startDate: recStartDate,
        categoryId: recCatId ? parseInt(recCatId, 10) : null,
        description: recDescription.trim()
      });
      setRecTitle('');
      setRecAmount('');
      setRecCatId('');
      setRecDescription('');
      fetchRecurringExpenses();
      fetchExpenses(); // Catch up might trigger immediate backfill transactions!
      fetchMonthlySummary();
      fetchBudgets();
      fetchInsights();
    } catch (err) {
      alert('Failed to schedule recurring expense.');
    } finally {
      setCreatingRecurring(false);
    }
  };

  const handleToggleRecurring = async (id) => {
    try {
      await toggleRecurringExpense(id);
      fetchRecurringExpenses();
      fetchExpenses();
      fetchMonthlySummary();
      fetchBudgets();
      fetchInsights();
    } catch (err) {
      alert('Failed to toggle active state.');
    }
  };

  const handleDeleteRecurring = async (id) => {
    if (!window.confirm('Delete this recurring schedule? Future transactions will not be generated automatically.')) return;
    try {
      await deleteRecurringExpense(id);
      fetchRecurringExpenses();
    } catch (err) {
      alert('Failed to delete recurring schedule.');
    }
  };

  // ===== REPORT EXPORTS =====
  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('expense_tracker_token');
      const response = await fetch('http://localhost:8081/api/expenses/export/csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export CSV report.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const token = localStorage.getItem('expense_tracker_token');
      const response = await fetch('http://localhost:8081/api/expenses/export/pdf', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expense_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export PDF report.');
    }
  };

  // ===== CATEGORY HANDLERS =====
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCatName.trim()) {
      setCategoryError('Category name is required.');
      return;
    }
    setAddingCategory(true);
    try {
      const res = await addCategory({ name: newCatName.trim(), color: newCatColor });
      const created = res.data;
      setCategories((prev) => [...prev, created]);
      setNewCatName('');
      setNewCatColor('#6c63ff');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to add category.';
      setCategoryError(typeof msg === 'string' ? msg : 'Failed to add category.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Expenses linked to it may become uncategorized.')) return;
    setDeletingCatId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      fetchBudgets(); // budgets might link to category
    } catch (err) {
      alert('Failed to delete category.');
    } finally {
      setDeletingCatId(null);
    }
  };

  // ===== COMPUTED STATS =====
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const thisMonth = (() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  })();

  const largestExpense = expenses.reduce((max, e) => (e.amount > max ? e.amount : max), 0);

  // Spending by category (for pie chart)
  const categorySpending = (() => {
    const map = {};
    expenses.forEach((exp) => {
      const cat = categories.find((c) => c.id === exp.categoryId);
      const name = cat?.name || 'Uncategorized';
      map[name] = (map[name] || 0) + (exp.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // Monthly bar chart data — last 6 months
  const barChartData = (() => {
    const breakdown = monthlySummary?.monthlyBreakdown || {};
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const serverKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // "May 2026"
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });     // "May 26"
      const month = d.getMonth();
      const year = d.getFullYear();

      let amount = 0;
      if (breakdown[serverKey] !== undefined) {
        amount = Number(breakdown[serverKey]) || 0;
      } else {
        amount = expenses
          .filter((e) => {
            const ed = new Date(e.date);
            return ed.getMonth() === month && ed.getFullYear() === year;
          })
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      }
      months.push({ month: label, amount });
    }
    return months;
  })();

  // Cumulative Daily Spending Flow data (Area / Line Chart)
  const cumulativeChartData = (() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();

    const thisMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === curMonth && d.getFullYear() === now.getFullYear();
    });

    const dayTotals = {};
    for (let day = 1; day <= totalDays; day++) {
      dayTotals[day] = 0;
    }
    thisMonthExpenses.forEach(e => {
      const day = new Date(e.date).getDate();
      dayTotals[day] = (dayTotals[day] || 0) + Number(e.amount);
    });

    const overallLimit = budgets.find(b => b.categoryId === null)?.amount || 0;

    const data = [];
    let runningSum = 0;
    
    for (let day = 1; day <= totalDays; day++) {
      if (day <= currentDay) {
        runningSum += dayTotals[day];
      }
      data.push({
        day: `D${day}`,
        spending: day <= currentDay ? runningSum : null,
        budget: overallLimit > 0 ? Number(overallLimit) : null
      });
    }
    return data;
  })();

  const isLoading = loadingExpenses || loadingCategories;

  return (
    <div className="dashboard-page page-enter">
      <Navbar />

      <div className="dashboard-content">
        {/* ===== PAGE HEADER ===== */}
        <div className="dashboard-header slide-up">
          <div>
            <h1 className="dashboard-greeting">
              {getGreeting()}, <span className="text-gradient">{user?.name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
            <p className="dashboard-date">{formatDisplayDate()}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={handleExportCsv}>
              📊 CSV Export
            </button>
            <button className="btn btn-outline" onClick={handleExportPdf}>
              📄 PDF Report
            </button>
            <button
              className="btn btn-lg"
              onClick={() => setShowExpenseForm(true)}
            >
              <span>➕</span>
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="summary-grid">
          <SummaryCard
            title="Total Expenses"
            value={isLoading ? '—' : formatCurrency(totalExpenses)}
            icon="💳"
            color="#6c63ff"
            subtitle="All time spending"
            index={0}
          />
          <SummaryCard
            title="This Month"
            value={isLoading ? '—' : formatCurrency(thisMonth)}
            icon="📅"
            color="#48cae4"
            subtitle={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            index={1}
          />
          <SummaryCard
            title="Transactions"
            value={isLoading ? '—' : expenses.length.toString()}
            icon="📊"
            color="#2ed573"
            subtitle="Total recorded"
            index={2}
          />
          <SummaryCard
            title="Largest Expense"
            value={isLoading ? '—' : formatCurrency(largestExpense)}
            icon="🏆"
            color="#ffa502"
            subtitle="Single transaction"
            index={3}
          />
        </div>

        {/* ===== SMART INSIGHTS PANEL ===== */}
        {!loadingInsights && insights.length > 0 && (
          <div className="insights-panel slide-up">
            <h3 className="insights-title">💡 Smart Spending Insights</h3>
            <div className="insights-grid">
              {insights.map((insight, idx) => (
                <div key={idx} className={`insight-card glass ${insight.type.toLowerCase()}`}>
                  <div className="insight-header">
                    <span className="insight-badge">{insight.type}</span>
                    {insight.impactValue && <span className="insight-impact">{insight.impactValue}</span>}
                  </div>
                  <h4 className="insight-card-title">{insight.title}</h4>
                  <p className="insight-desc">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CHARTS ROW ===== */}
        <div className="charts-grid">
          {/* Bar Chart */}
          <div className="chart-card glass">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Monthly Spending</h3>
                <p className="chart-subtitle">Last 6 months overview</p>
              </div>
              <span className="chart-icon">📈</span>
            </div>
            {loadingSummary && loadingExpenses ? (
              <div className="chart-loading">
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : barChartData.every((d) => d.amount === 0) ? (
              <div className="chart-empty">
                <span>📊</span>
                <p>No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6c63ff" stopOpacity={1} />
                      <stop offset="100%" stopColor="#48cae4" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                    }
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar
                    dataKey="amount"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Chart */}
          <div className="chart-card glass">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">By Category</h3>
                <p className="chart-subtitle">Spending distribution</p>
              </div>
              <span className="chart-icon">🥧</span>
            </div>
            {loadingExpenses || loadingCategories ? (
              <div className="chart-loading">
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : categorySpending.length === 0 ? (
              <div className="chart-empty">
                <span>🏷️</span>
                <p>No category data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltipContent />} />
                  <Legend content={renderPieLegend} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cumulative Spending Area Chart (Full Width) */}
          <div className="chart-card glass" style={{ gridColumn: '1 / -1', minHeight: 340 }}>
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Cumulative Monthly Trajectory</h3>
                <p className="chart-subtitle">Track your day-by-day spending accumulation against overall monthly limit</p>
              </div>
              <span className="chart-icon">📉</span>
            </div>
            {loadingExpenses ? (
              <div className="chart-loading">
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cumulativeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#48cae4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#48cae4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<BarTooltip />} />
                  <Area type="monotone" dataKey="spending" stroke="#48cae4" fillOpacity={1} fill="url(#spendGradient)" strokeWidth={2.5} name="Cumulative Spending" />
                  <Line type="monotone" dataKey="budget" stroke="#ff4757" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Overall Budget Limit" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ===== BUDGETS & RECURRING SIDE-BY-SIDE GRID ===== */}
        <div className="dashboard-double-column">
          {/* Budget Manager */}
          <div className="section-card glass">
            <div className="section-header">
              <div>
                <h3 className="section-title">🎯 Target Budgets</h3>
                <p className="section-subtitle">Set monthly targets per category and track progress</p>
              </div>
            </div>
            
            <div className="budget-list">
              {loadingBudgets ? (
                <div className="spinner-container"><div className="spinner" /></div>
              ) : budgets.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>No budgets set. Define one below!</p>
              ) : (
                budgets.map(b => (
                  <div key={b.id} className="budget-item glass">
                    <div className="budget-meta">
                      <span className="budget-category" style={{ color: b.categoryColor }}>
                        {b.categoryId ? `🏷️ ${b.categoryName}` : '💳 Overall Monthly Limit'}
                      </span>
                      <span className="budget-amount">{formatCurrency(b.currentSpending)} / {formatCurrency(b.amount)}</span>
                    </div>
                    <div className="budget-progress-bar-container">
                      <div 
                        className={`budget-progress-bar ${b.progressPercentage >= 100 ? 'danger' : b.progressPercentage >= 80 ? 'warning' : 'success'}`} 
                        style={{ width: `${Math.min(b.progressPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="budget-footer">
                      <span className="budget-percentage">{b.progressPercentage.toFixed(1)}% spent</span>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteBudget(b.id)}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSetBudget} className="budget-form">
              <h4 className="add-category-title">Configure Budget Target</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select className="input" value={budgetCatId} onChange={e => setBudgetCatId(e.target.value)} style={{ flex: 1.2, minWidth: 150 }}>
                  <option value="">Overall Monthly Limit</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input 
                  className="input" 
                  type="number" 
                  placeholder="Target (₹)..." 
                  value={budgetAmount} 
                  onChange={e => setBudgetAmount(e.target.value)} 
                  min="1" 
                  style={{ flex: 1, minWidth: 100 }}
                  required
                />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={settingBudget}>
                {settingBudget ? 'Saving...' : 'Set Budget Limit'}
              </button>
            </form>
          </div>

          {/* Recurring Expense Manager */}
          <div className="section-card glass">
            <div className="section-header">
              <div>
                <h3 className="section-title">🔁 Recurring Subscriptions</h3>
                <p className="section-subtitle">Set up schedules for automatically generated transactions</p>
              </div>
            </div>

            <div className="recurring-list">
              {loadingRecurring ? (
                <div className="spinner-container"><div className="spinner" /></div>
              ) : recurringExpenses.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>No recurring schedules active.</p>
              ) : (
                recurringExpenses.map(r => (
                  <div key={r.id} className="recurring-item glass animate-fade-in">
                    <div className="rec-header">
                      <div>
                        <div className="rec-title">{r.title}</div>
                        <div className="rec-frequency">{r.frequency}</div>
                      </div>
                      <div className="rec-amount">{formatCurrency(r.amount)}</div>
                    </div>
                    <div className="rec-dates">
                      <span>Next due: {new Date(r.nextDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <div className="toggle-switch" title="Toggle active/inactive state">
                        <input 
                          type="checkbox" 
                          id={`toggle-${r.id}`} 
                          checked={r.active} 
                          onChange={() => handleToggleRecurring(r.id)} 
                        />
                        <label htmlFor={`toggle-${r.id}`} />
                      </div>
                    </div>
                    <div className="rec-actions">
                      <span className="text-muted" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {r.categoryId ? <CategoryBadge name={r.categoryName} color={r.categoryColor} /> : 'Uncategorized'}
                      </span>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteRecurring(r.id)}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCreateRecurring} className="recurring-form">
              <h4 className="add-category-title">Schedule Recurring Transaction</h4>
              <input 
                className="input" 
                placeholder="Schedule Title (e.g. Rent, Gym)..." 
                value={recTitle} 
                onChange={e => setRecTitle(e.target.value)} 
                required 
              />
              <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 10, margin: '4px 0' }}>
                <input 
                  className="input" 
                  type="number" 
                  placeholder="Amount (₹)..." 
                  value={recAmount} 
                  onChange={e => setRecAmount(e.target.value)} 
                  min="1" 
                  required 
                />
                <select className="input" value={recFrequency} onChange={e => setRecFrequency(e.target.value)}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 10, margin: '4px 0' }}>
                <input 
                  className="input" 
                  type="date" 
                  value={recStartDate} 
                  onChange={e => setRecStartDate(e.target.value)} 
                  required 
                  style={{ colorScheme: 'dark' }}
                />
                <select className="input" value={recCatId} onChange={e => setRecCatId(e.target.value)}>
                  <option value="">No Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <input 
                className="input" 
                placeholder="Description (optional)..." 
                value={recDescription} 
                onChange={e => setRecDescription(e.target.value)} 
              />
              <button type="submit" className="btn" style={{ width: '100%', marginTop: 4 }} disabled={creatingRecurring}>
                {creatingRecurring ? 'Creating Schedule...' : 'Schedule Automatic Billing'}
              </button>
            </form>
          </div>
        </div>

        {/* ===== CATEGORIES SECTION ===== */}
        <div className="section-card glass">
          <div className="section-header">
            <div>
              <h3 className="section-title">
                <span>🏷️</span> Categories
              </h3>
              <p className="section-subtitle">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'} configured
              </p>
            </div>
          </div>

          {/* Category list */}
          {loadingCategories ? (
            <div className="categories-loading">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 32, borderRadius: 999, width: 100 + i * 20 }} />
              ))}
            </div>
          ) : (
            <div className="categories-list">
              {categories.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                  No categories yet. Add one below!
                </p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="category-item">
                    <CategoryBadge name={cat.name} color={cat.color} />
                    <button
                      className="btn btn-ghost btn-icon btn-sm category-delete-btn"
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={deletingCatId === cat.id}
                      title="Delete category"
                    >
                      {deletingCatId === cat.id ? (
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                      ) : (
                        '✕'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add category form */}
          <div className="add-category-form">
            <h4 className="add-category-title">Add New Category</h4>
            {categoryError && (
              <div className="error-banner" style={{ marginBottom: 12 }}>
                <span>⚠️</span>
                <span>{categoryError}</span>
              </div>
            )}
            <form onSubmit={handleAddCategory} className="add-category-row">
              <input
                className="input"
                type="text"
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (categoryError) setCategoryError('');
                }}
                maxLength={50}
                style={{ flex: 1, minWidth: 150 }}
              />
              <div className="color-picker-wrapper" title="Pick color">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="color-picker"
                  title="Choose color"
                />
                <div
                  className="color-picker-preview"
                  style={{ background: newCatColor }}
                />
              </div>
              <button type="submit" className="btn" disabled={addingCategory}>
                {addingCategory ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    <span>Add</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ===== EXPENSES SECTION ===== */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <h3 className="section-title">
                <span>💸</span> Expense History
              </h3>
              <p className="section-subtitle">
                {expenses.length} total {expenses.length === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
            <button
              className="btn"
              onClick={() => setShowExpenseForm(true)}
            >
              <span>➕</span>
              <span>Add Expense</span>
            </button>
          </div>

          {expenseError && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <span>{expenseError}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={fetchExpenses}
                style={{ marginLeft: 'auto' }}
              >
                Retry
              </button>
            </div>
          )}

          {loadingExpenses ? (
            <div className="expense-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="expense-skeleton glass">
                  <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                    <div className="skeleton" style={{ height: 11, width: '35%' }} />
                  </div>
                  <div className="skeleton" style={{ height: 14, width: 80 }} />
                </div>
              ))}
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              categories={categories}
              onDelete={handleDeleteExpense}
            />
          )}
        </div>
      </div>

      {/* ===== EXPENSE FORM MODAL ===== */}
      {showExpenseForm && (
        <ExpenseForm
          categories={categories}
          onAdd={handleAddExpense}
          onRefreshCategories={fetchCategories}
          onClose={() => setShowExpenseForm(false)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
