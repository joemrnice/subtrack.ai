/**
 * SubTrack Application Engine & UI Controller
 */

class SubTrackApp {
  constructor() {
    // Application State
    this.subscriptions = [];
    this.filteredSubscriptions = [];
    this.currentView = 'dashboard';
    this.periodDisplay = 'Monthly'; // 'Monthly' or 'Annual'
    this.viewMode = 'grid'; // 'grid' or 'table'
    this.theme = localStorage.getItem('subtrack_theme') || 'light';

    // Multi-step modal state
    this.addModalStep = 1;
    this.newSubData = {
      name: '',
      price: '',
      billingCycle: 'Monthly',
      category: 'Software',
      nextPaymentDate: '',
      icon: 'credit-card',
      color: '#6366f1'
    };

    // Calendar state
    this.calendarDate = new Date();

    // Chart instances
    this.charts = {};

    // Flatpickr instances
    this.addFlatpickr = null;
    this.editFlatpickr = null;

    // Item pending deletion ID
    this.deletingSubId = null;
  }

  /**
   * Initialize App
   */
  async init() {
    this.applyTheme(this.theme);
    this.initFlatpickr();
    await this.loadData();
    this.setupEventListeners();
    this.navigateTo(this.currentView);
  }

  /**
   * Theme Management
   */
  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('subtrack_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Re-render charts on theme toggle to adjust label colors
    this.updateCharts();
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  /**
   * Initialize Flatpickr Datepickers
   */
  initFlatpickr() {
    if (typeof flatpickr !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      this.addFlatpickr = flatpickr("#add-input-date", {
        defaultDate: today,
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: (selectedDates, dateStr) => {
          this.newSubData.nextPaymentDate = dateStr;
        }
      });
      this.newSubData.nextPaymentDate = today;

      this.editFlatpickr = flatpickr("#edit-input-date", {
        dateFormat: "Y-m-d"
      });
    }
  }

  /**
   * Load data from mockApi
   */
  async loadData() {
    try {
      this.subscriptions = await window.mockApi.fetchSubscriptions();
      this.applyFiltersAndSort();
    } catch (err) {
      this.showToast('Failed to load subscriptions', 'error');
      console.error(err);
    }
  }

  /**
   * Navigation View Router
   */
  navigateTo(viewName) {
    this.currentView = viewName;

    // Hide all view sections
    const views = ['dashboard', 'subscriptions', 'analytics', 'calendar', 'insights'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.add('hidden');
    });

    // Show target view section
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    // Update nav button active states
    document.querySelectorAll('[data-nav]').forEach(btn => {
      if (btn.dataset.nav === viewName) {
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-brand-600', 'dark:text-brand-400', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-brand-600', 'dark:text-brand-400', 'shadow-sm');
        btn.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });

    // Refresh Lucide Icons
    if (window.lucide) window.lucide.createIcons();

    // Trigger view specific rendering
    if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'subscriptions') {
      this.renderSubscriptionsView();
    } else if (viewName === 'analytics') {
      this.renderAnalytics();
    } else if (viewName === 'calendar') {
      this.renderCalendar();
    } else if (viewName === 'insights') {
      this.renderInsightsPage();
    }
  }

  toggleMobileNav() {
    const nav = document.getElementById('mobile-nav');
    if (nav) nav.classList.toggle('hidden');
  }

  /**
   * Calculate Stats Helper
   */
  getStats() {
    const activeSubs = this.subscriptions.filter(s => s.status === 'Active');

    // Calculate Monthly Spending Total
    const totalMonthly = activeSubs.reduce((acc, sub) => {
      if (sub.billingCycle === 'Yearly') {
        return acc + (sub.price / 12);
      }
      return acc + sub.price;
    }, 0);

    const totalAnnual = totalMonthly * 12;

    // Potential savings calculation
    const unusedCount = activeSubs.filter(s => {
      if (!s.lastUsedDate) return false;
      const days = (new Date() - new Date(s.lastUsedDate)) / (1000 * 3600 * 24);
      return days >= 25;
    });

    const unusedSavings = unusedCount.reduce((acc, s) => {
      return acc + (s.billingCycle === 'Yearly' ? s.price / 12 : s.price);
    }, 0);

    return {
      activeCount: activeSubs.length,
      totalMonthly: totalMonthly.toFixed(2),
      totalAnnual: totalAnnual.toFixed(2),
      potentialSavings: unusedSavings.toFixed(2),
      activeSubs
    };
  }

  /**
   * Render Dashboard View
   */
  renderDashboard() {
    const stats = this.getStats();

    // Update Visual Stats Numbers
    const elMonthly = document.getElementById('stat-monthly-spending');
    const elActive = document.getElementById('stat-active-count');
    const elAnnual = document.getElementById('stat-annual-cost');
    const elSavings = document.getElementById('stat-potential-savings');

    if (elMonthly) elMonthly.textContent = `$${stats.totalMonthly}`;
    if (elActive) elActive.textContent = stats.activeCount;
    if (elAnnual) elAnnual.textContent = `$${stats.totalAnnual}`;
    if (elSavings) elSavings.textContent = `$${stats.potentialSavings}`;

    // Render Upcoming Payments List
    this.renderUpcomingPaymentsList();

    // Render Recently Added Subscriptions List
    this.renderRecentSubscriptionsList();

    // Render Dashboard AI Banner
    this.renderDashboardAIBanner();

    // Render Charts
    this.updateDashboardCharts();

    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Upcoming Payments List Component
   */
  renderUpcomingPaymentsList() {
    const container = document.getElementById('upcoming-payments-list');
    if (!container) return;

    // Sort active subscriptions by next payment date
    const sorted = [...this.subscriptions]
      .filter(s => s.status === 'Active')
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate))
      .slice(0, 4);

    if (sorted.length === 0) {
      container.innerHTML = `<div class="text-xs text-slate-400 py-4 text-center">No upcoming payments found.</div>`;
      return;
    }

    container.innerHTML = sorted.map(sub => {
      const daysLeft = Math.ceil((new Date(sub.nextPaymentDate) - new Date()) / (1000 * 3600 * 24));
      const badgeColor = daysLeft <= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';

      return `
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:border-brand-300 transition-all">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style="background-color: ${sub.color || '#6366f1'}">
              <i data-lucide="${sub.icon || 'credit-card'}" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">${sub.name}</h4>
              <p class="text-[11px] text-slate-400">${sub.category} &bull; ${sub.billingCycle}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-extrabold text-slate-900 dark:text-white">$${sub.price.toFixed(2)}</span>
            <div class="mt-0.5">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeColor}">
                ${daysLeft === 0 ? 'Due Today' : daysLeft < 0 ? 'Past Due' : `In ${daysLeft} days`}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Recently Added List Component
   */
  renderRecentSubscriptionsList() {
    const container = document.getElementById('recent-subscriptions-list');
    if (!container) return;

    const recent = [...this.subscriptions]
      .sort((a, b) => new Date(b.createdAt || '2023-01-01') - new Date(a.createdAt || '2023-01-01'))
      .slice(0, 4);

    container.innerHTML = recent.map(sub => `
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style="background-color: ${sub.color || '#6366f1'}">
            <i data-lucide="${sub.icon || 'credit-card'}" class="w-4 h-4"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">${sub.name}</h4>
            <p class="text-[11px] text-slate-400">Added ${sub.createdAt || 'Recently'}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-extrabold text-slate-900 dark:text-white">$${sub.price.toFixed(2)} / ${sub.billingCycle === 'Monthly' ? 'mo' : 'yr'}</span>
          <div class="mt-0.5">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
              ${sub.status}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Dashboard AI Banner
   */
  async renderDashboardAIBanner() {
    try {
      const insights = await window.mockApi.generateFinancialInsights();
      const title = document.getElementById('dashboard-ai-title');
      const desc = document.getElementById('dashboard-ai-desc');
      if (title && desc && insights.recommendations.length > 0) {
        title.textContent = insights.recommendations[0].title;
        desc.textContent = insights.recommendations[0].description;
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Subscriptions View Rendering
   */
  renderSubscriptionsView() {
    this.applyFiltersAndSort();
    const gridContainer = document.getElementById('subscriptions-grid-container');
    const tableContainer = document.getElementById('subscriptions-table-container');
    const tableBody = document.getElementById('subscriptions-table-body');
    const emptyState = document.getElementById('subscriptions-empty-state');

    if (this.filteredSubscriptions.length === 0) {
      if (gridContainer) gridContainer.classList.add('hidden');
      if (tableContainer) tableContainer.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    if (this.viewMode === 'grid') {
      if (gridContainer) gridContainer.classList.remove('hidden');
      if (tableContainer) tableContainer.classList.add('hidden');

      gridContainer.innerHTML = this.filteredSubscriptions.map(sub => this.createSubscriptionCardHTML(sub)).join('');
    } else {
      if (gridContainer) gridContainer.classList.add('hidden');
      if (tableContainer) tableContainer.classList.remove('hidden');

      tableBody.innerHTML = this.filteredSubscriptions.map(sub => this.createSubscriptionTableRowHTML(sub)).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Generate Card HTML
   */
  createSubscriptionCardHTML(sub) {
    const displayPrice = this.periodDisplay === 'Annual'
      ? (sub.billingCycle === 'Monthly' ? sub.price * 12 : sub.price)
      : (sub.billingCycle === 'Yearly' ? sub.price / 12 : sub.price);

    const periodLabel = this.periodDisplay === 'Annual' ? '/yr' : '/mo';
    const annualTotal = sub.billingCycle === 'Yearly' ? sub.price : sub.price * 12;

    const isUnused = sub.lastUsedDate && ((new Date() - new Date(sub.lastUsedDate)) / (1000 * 3600 * 24)) >= 25;

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
        ${isUnused ? `<div class="absolute top-3 right-3 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1"><i data-lucide="alert-circle" class="w-3 h-3"></i><span>Unused</span></div>` : ''}

        <div>
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-md" style="background-color: ${sub.color || '#6366f1'}">
              <i data-lucide="${sub.icon || 'credit-card'}" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">${sub.name}</h3>
              <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">${sub.category}</span>
            </div>
          </div>

          <div class="my-4 space-y-1.5 border-t border-b border-slate-100 dark:border-slate-700/50 py-3 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-500">Billing Cycle:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">${sub.billingCycle}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Next Renewal:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">${sub.nextPaymentDate}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Annual Expense:</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">$${annualTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <div>
            <span class="text-lg font-extrabold text-slate-900 dark:text-white">$${displayPrice.toFixed(2)}</span>
            <span class="text-xs text-slate-400">${periodLabel}</span>
          </div>

          <div class="flex items-center space-x-1">
            <button onclick="app.toggleSubStatus('${sub.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300'} transition-all">
              ${sub.status}
            </button>
            <button onclick="app.openEditModal('${sub.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="app.openDeleteModal('${sub.id}', '${sub.name}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate Table Row HTML
   */
  createSubscriptionTableRowHTML(sub) {
    const displayPrice = this.periodDisplay === 'Annual'
      ? (sub.billingCycle === 'Monthly' ? sub.price * 12 : sub.price)
      : (sub.billingCycle === 'Yearly' ? sub.price / 12 : sub.price);

    const periodLabel = this.periodDisplay === 'Annual' ? '/yr' : '/mo';
    const annualTotal = sub.billingCycle === 'Yearly' ? sub.price : sub.price * 12;

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
        <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold" style="background-color: ${sub.color || '#6366f1'}">
            <i data-lucide="${sub.icon || 'credit-card'}" class="w-4 h-4"></i>
          </div>
          <span>${sub.name}</span>
        </td>
        <td class="py-3.5 px-4"><span class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-medium">${sub.category}</span></td>
        <td class="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">${sub.billingCycle}</td>
        <td class="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">$${displayPrice.toFixed(2)}<span class="text-[10px] text-slate-400 font-normal">${periodLabel}</span></td>
        <td class="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">${sub.nextPaymentDate}</td>
        <td class="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">$${annualTotal.toFixed(2)}</td>
        <td class="py-3.5 px-4">
          <button onclick="app.toggleSubStatus('${sub.id}')" class="px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
            ${sub.status}
          </button>
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end space-x-1">
            <button onclick="app.openEditModal('${sub.id}')" class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            <button onclick="app.openDeleteModal('${sub.id}', '${sub.name}')" class="p-1 rounded text-slate-400 hover:text-rose-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Filter and Sort Logic
   */
  handleFilterChange() {
    this.applyFiltersAndSort();
    if (this.currentView === 'subscriptions') {
      this.renderSubscriptionsView();
    }
  }

  handleGlobalSearch(query) {
    const filterSearch = document.getElementById('filter-search');
    if (filterSearch) filterSearch.value = query;
    if (this.currentView !== 'subscriptions') {
      this.navigateTo('subscriptions');
    } else {
      this.handleFilterChange();
    }
  }

  applyFiltersAndSort() {
    const searchVal = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('filter-category')?.value || 'All';
    const statusVal = document.getElementById('filter-status')?.value || 'All';
    const cycleVal = document.getElementById('filter-cycle')?.value || 'All';
    const sortVal = document.getElementById('filter-sort')?.value || 'price-desc';

    let result = [...this.subscriptions];

    // Search
    if (searchVal) {
      result = result.filter(s => s.name.toLowerCase().includes(searchVal) || s.category.toLowerCase().includes(searchVal));
    }

    // Category
    if (catVal !== 'All') {
      result = result.filter(s => s.category === catVal);
    }

    // Status
    if (statusVal !== 'All') {
      result = result.filter(s => s.status === statusVal);
    }

    // Cycle
    if (cycleVal !== 'All') {
      result = result.filter(s => s.billingCycle === cycleVal);
    }

    // Sort
    if (sortVal === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortVal === 'date-asc') {
      result.sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
    }

    this.filteredSubscriptions = result;
  }

  resetFilters() {
    if (document.getElementById('filter-search')) document.getElementById('filter-search').value = '';
    if (document.getElementById('filter-category')) document.getElementById('filter-category').value = 'All';
    if (document.getElementById('filter-status')) document.getElementById('filter-status').value = 'All';
    if (document.getElementById('filter-cycle')) document.getElementById('filter-cycle').value = 'All';
    if (document.getElementById('filter-sort')) document.getElementById('filter-sort').value = 'price-desc';
    this.handleFilterChange();
  }

  setPeriod(period) {
    this.periodDisplay = period;
    const btnMonthly = document.getElementById('period-monthly-btn');
    const btnAnnual = document.getElementById('period-annual-btn');

    if (period === 'Monthly') {
      btnMonthly?.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
      btnMonthly?.classList.remove('text-slate-500');
      btnAnnual?.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
      btnAnnual?.classList.add('text-slate-500');
    } else {
      btnAnnual?.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
      btnAnnual?.classList.remove('text-slate-500');
      btnMonthly?.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
      btnMonthly?.classList.add('text-slate-500');
    }

    if (this.currentView === 'subscriptions') {
      this.renderSubscriptionsView();
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const gridBtn = document.getElementById('view-mode-grid');
    const tableBtn = document.getElementById('view-mode-table');

    if (mode === 'grid') {
      gridBtn?.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
      tableBtn?.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
    } else {
      tableBtn?.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
      gridBtn?.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
    }

    if (this.currentView === 'subscriptions') {
      this.renderSubscriptionsView();
    }
  }

  async toggleSubStatus(id) {
    const sub = this.subscriptions.find(s => s.id === id);
    if (!sub) return;

    const nextStatus = sub.status === 'Active' ? 'Paused' : 'Active';
    try {
      await window.mockApi.updateSubscription(id, { status: nextStatus });
      sub.status = nextStatus;
      this.showToast(`Subscription ${nextStatus === 'Active' ? 'activated' : 'paused'} successfully`, 'success');
      this.navigateTo(this.currentView);
    } catch (e) {
      this.showToast('Failed to update status', 'error');
    }
  }

  /**
   * Analytics Page Rendering
   */
  renderAnalytics() {
    const stats = this.getStats();

    const elMonthly = document.getElementById('analytics-stat-monthly');
    const elAnnual = document.getElementById('analytics-stat-annual');
    const elTopCat = document.getElementById('analytics-stat-top-cat');
    const elTopCatVal = document.getElementById('analytics-stat-top-cat-val');
    const elRatio = document.getElementById('analytics-stat-active-ratio');

    if (elMonthly) elMonthly.textContent = `$${stats.totalMonthly}`;
    if (elAnnual) elAnnual.textContent = `$${stats.totalAnnual}`;
    if (elRatio) elRatio.textContent = `${stats.activeCount} / ${this.subscriptions.length}`;

    // Compute top category
    const categoryTotals = {};
    stats.activeSubs.forEach(s => {
      const val = s.billingCycle === 'Yearly' ? s.price / 12 : s.price;
      categoryTotals[s.category] = (categoryTotals[s.category] || 0) + val;
    });

    let topCat = 'None';
    let topVal = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > topVal) {
        topVal = val;
        topCat = cat;
      }
    });

    if (elTopCat) elTopCat.textContent = topCat;
    if (elTopCatVal) elTopCatVal.textContent = `$${topVal.toFixed(2)} / month`;

    this.updateAnalyticsCharts();
  }

  /**
   * Calendar Page Rendering
   */
  renderCalendar() {
    const monthYearLabel = document.getElementById('calendar-month-year');
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (monthYearLabel) monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="min-h-[90px] p-2 bg-slate-50/50 dark:bg-slate-900/30"></div>`;
    }

    // Days cells
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dayStr === todayStr;

      // Find subscriptions matching day
      const daySubs = this.subscriptions.filter(s => {
        const subDate = new Date(s.nextPaymentDate);
        return subDate.getDate() === day && subDate.getMonth() === month && subDate.getFullYear() === year;
      });

      html += `
        <div class="min-h-[90px] p-2 border-b border-r border-slate-100 dark:border-slate-700/50 relative ${isToday ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''}">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold ${isToday ? 'w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}">${day}</span>
          </div>

          <div class="mt-1 space-y-1">
            ${daySubs.map(s => `
              <div onclick="app.openEditModal('${s.id}')" class="cursor-pointer p-1 rounded-md text-[10px] font-bold truncate flex items-center space-x-1 shadow-sm ${s.status === 'Active' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}" title="${s.name} - $${s.price}">
                <span class="truncate">${s.name}</span>
                <span class="font-normal opacity-90">$${s.price}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;
  }

  prevCalendarMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextCalendarMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
    this.renderCalendar();
  }

  /**
   * AI Insights Page Rendering
   */
  async renderInsightsPage() {
    const container = document.getElementById('insights-cards-container');
    if (!container) return;

    try {
      const data = await window.mockApi.generateFinancialInsights();
      container.innerHTML = data.recommendations.map(rec => `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-400 transition-all">
          <div class="space-y-1.5">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              ${rec.badge}
            </span>
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">${rec.title}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-300 max-w-2xl">${rec.description}</p>
          </div>
          <button onclick="app.handleInsightAction('${rec.actionType}')" class="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 whitespace-nowrap shadow-md">
            ${rec.actionLabel}
          </button>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  }

  handleInsightAction(type) {
    if (type === 'FILTER_UNUSED') {
      this.navigateTo('subscriptions');
      const sortSelect = document.getElementById('filter-sort');
      if (sortSelect) sortSelect.value = 'price-desc';
      this.handleFilterChange();
    } else if (type === 'FILTER_SOFTWARE') {
      this.navigateTo('subscriptions');
      const catSelect = document.getElementById('filter-category');
      if (catSelect) catSelect.value = 'Software';
      this.handleFilterChange();
    } else if (type === 'VIEW_ANNUAL_PLANS') {
      this.navigateTo('subscriptions');
      const cycleSelect = document.getElementById('filter-cycle');
      if (cycleSelect) cycleSelect.value = 'Monthly';
      this.handleFilterChange();
    }
  }

  /**
   * Multi-Step Add Subscription Modal Handlers
   */
  openAddModal() {
    this.addModalStep = 1;
    this.updateAddModalUI();
    document.getElementById('modal-add-subscription')?.classList.remove('hidden');
  }

  closeAddModal() {
    document.getElementById('modal-add-subscription')?.classList.add('hidden');
  }

  selectServicePreset(name, category, icon, color) {
    this.newSubData.name = name === 'Custom Service' ? '' : name;
    this.newSubData.category = category;
    this.newSubData.icon = icon;
    this.newSubData.color = color;

    const nameInput = document.getElementById('add-input-name');
    if (nameInput) nameInput.value = this.newSubData.name;
    this.nextAddStep();
  }

  setAddBillingCycle(cycle) {
    this.newSubData.billingCycle = cycle;
    const btnMonthly = document.getElementById('billing-btn-monthly');
    const btnYearly = document.getElementById('billing-btn-yearly');
    if (cycle === 'Monthly') {
      btnMonthly?.classList.add('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-950/30');
      btnYearly?.classList.remove('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-950/30');
    } else {
      btnYearly?.classList.add('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-950/30');
      btnMonthly?.classList.remove('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-950/30');
    }
  }

  setAddCategory(cat) {
    this.newSubData.category = cat;
    this.nextAddStep();
  }

  nextAddStep() {
    if (this.addModalStep === 1) {
      const nameVal = document.getElementById('add-input-name')?.value.trim();
      if (nameVal) this.newSubData.name = nameVal;
      if (!this.newSubData.name) {
        this.showToast('Please enter a service name', 'warning');
        return;
      }
    } else if (this.addModalStep === 2) {
      const priceVal = parseFloat(document.getElementById('add-input-price')?.value);
      if (isNaN(priceVal) || priceVal <= 0) {
        this.showToast('Please enter a valid price', 'warning');
        return;
      }
      this.newSubData.price = priceVal;
    } else if (this.addModalStep === 5) {
      const dateVal = document.getElementById('add-input-date')?.value;
      if (!dateVal) {
        this.showToast('Please select a payment date', 'warning');
        return;
      }
      this.newSubData.nextPaymentDate = dateVal;
    }

    if (this.addModalStep < 6) {
      this.addModalStep++;
      this.updateAddModalUI();
    } else {
      this.submitAddSubscription();
    }
  }

  prevAddStep() {
    if (this.addModalStep > 1) {
      this.addModalStep--;
      this.updateAddModalUI();
    }
  }

  updateAddModalUI() {
    const stepLabel = document.getElementById('add-modal-step-label');
    const progressBar = document.getElementById('add-modal-progress');
    const prevBtn = document.getElementById('add-prev-btn');
    const nextBtn = document.getElementById('add-next-btn');

    const labels = [
      'Step 1 of 6 — Select Service',
      'Step 2 of 6 — Subscription Price',
      'Step 3 of 6 — Billing Frequency',
      'Step 4 of 6 — Select Category',
      'Step 5 of 6 — Next Renewal Date',
      'Step 6 of 6 — Confirmation Summary'
    ];

    if (stepLabel) stepLabel.textContent = labels[this.addModalStep - 1];
    if (progressBar) progressBar.style.width = `${(this.addModalStep / 6) * 100}%`;

    if (prevBtn) {
      if (this.addModalStep > 1) prevBtn.classList.remove('invisible');
      else prevBtn.classList.add('invisible');
    }

    if (nextBtn) {
      nextBtn.textContent = this.addModalStep === 6 ? 'Confirm & Add Sub' : 'Next →';
    }

    // Hide/show step containers
    for (let i = 1; i <= 6; i++) {
      const stepEl = document.getElementById(`add-step-${i}`);
      if (stepEl) {
        if (i === this.addModalStep) stepEl.classList.remove('hidden');
        else stepEl.classList.add('hidden');
      }
    }

    // Fill confirmation values
    if (this.addModalStep === 6) {
      const nameVal = document.getElementById('confirm-val-name');
      const priceVal = document.getElementById('confirm-val-price');
      const cycleVal = document.getElementById('confirm-val-cycle');
      const catVal = document.getElementById('confirm-val-cat');
      const dateVal = document.getElementById('confirm-val-date');

      if (nameVal) nameVal.textContent = this.newSubData.name;
      if (priceVal) priceVal.textContent = `$${parseFloat(this.newSubData.price).toFixed(2)}`;
      if (cycleVal) cycleVal.textContent = this.newSubData.billingCycle;
      if (catVal) catVal.textContent = this.newSubData.category;
      if (dateVal) dateVal.textContent = this.newSubData.nextPaymentDate;
    }
  }

  async submitAddSubscription() {
    try {
      const created = await window.mockApi.createSubscription(this.newSubData);
      this.subscriptions.unshift(created);
      this.closeAddModal();
      this.showToast(`${created.name} added successfully!`, 'success');
      this.navigateTo(this.currentView);
    } catch (e) {
      this.showToast('Failed to create subscription', 'error');
    }
  }

  /**
   * Edit Modal Handlers
   */
  openEditModal(id) {
    const sub = this.subscriptions.find(s => s.id === id);
    if (!sub) return;

    document.getElementById('edit-sub-id').value = sub.id;
    document.getElementById('edit-input-name').value = sub.name;
    document.getElementById('edit-input-price').value = sub.price;
    document.getElementById('edit-input-cycle').value = sub.billingCycle;
    document.getElementById('edit-input-cat').value = sub.category;
    document.getElementById('edit-input-status').value = sub.status;

    if (this.editFlatpickr) {
      this.editFlatpickr.setDate(sub.nextPaymentDate);
    }

    document.getElementById('modal-edit-subscription')?.classList.remove('hidden');
  }

  closeEditModal() {
    document.getElementById('modal-edit-subscription')?.classList.add('hidden');
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-sub-id').value;
    const updateData = {
      name: document.getElementById('edit-input-name').value,
      price: parseFloat(document.getElementById('edit-input-price').value),
      billingCycle: document.getElementById('edit-input-cycle').value,
      category: document.getElementById('edit-input-cat').value,
      status: document.getElementById('edit-input-status').value,
      nextPaymentDate: document.getElementById('edit-input-date').value
    };

    try {
      const updated = await window.mockApi.updateSubscription(id, updateData);
      const idx = this.subscriptions.findIndex(s => s.id === id);
      if (idx !== -1) this.subscriptions[idx] = updated;

      this.closeEditModal();
      this.showToast('Subscription updated successfully', 'success');
      this.navigateTo(this.currentView);
    } catch (err) {
      this.showToast('Failed to update subscription', 'error');
    }
  }

  /**
   * Delete Modal Handlers
   */
  openDeleteModal(id, name) {
    this.deletingSubId = id;
    const titleEl = document.getElementById('delete-sub-title');
    if (titleEl) titleEl.textContent = name;

    const confirmBtn = document.getElementById('delete-confirm-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => this.confirmDeleteSubscription();
    }

    document.getElementById('modal-delete-subscription')?.classList.remove('hidden');
  }

  closeDeleteModal() {
    this.deletingSubId = null;
    document.getElementById('modal-delete-subscription')?.classList.add('hidden');
  }

  async confirmDeleteSubscription() {
    if (!this.deletingSubId) return;
    try {
      await window.mockApi.deleteSubscription(this.deletingSubId);
      this.subscriptions = this.subscriptions.filter(s => s.id !== this.deletingSubId);
      this.closeDeleteModal();
      this.showToast('Subscription deleted', 'success');
      this.navigateTo(this.currentView);
    } catch (e) {
      this.showToast('Failed to delete subscription', 'error');
    }
  }

  /**
   * Toast Notifications Helper
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-slate-950',
      info: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
    };

    toast.className = `px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-toast-in pointer-events-auto ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Setup Event Listeners
   */
  setupEventListeners() {
    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAddModal();
        this.closeEditModal();
        this.closeDeleteModal();
      }
    });
  }

  /**
   * Chart lifecycle management
   */
  updateCharts() {
    if (this.currentView === 'dashboard') {
      this.updateDashboardCharts();
    } else if (this.currentView === 'analytics') {
      this.updateAnalyticsCharts();
    }
  }

  updateDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    const isDark = this.theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#6b7280';

    // Chart 1: Dashboard Category Doughnut
    const ctxCategory = document.getElementById('categoryChartDashboard')?.getContext('2d');
    if (ctxCategory) {
      if (this.charts.dashCategory) this.charts.dashCategory.destroy();

      const catTotals = {};
      this.subscriptions.filter(s => s.status === 'Active').forEach(s => {
        const val = s.billingCycle === 'Yearly' ? s.price / 12 : s.price;
        catTotals[s.category] = (catTotals[s.category] || 0) + val;
      });

      this.charts.dashCategory = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catTotals),
          datasets: [{
            data: Object.values(catTotals),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#f43f5e'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, font: { size: 10, weight: '600' } }
            }
          },
          cutout: '70%'
        }
      });
    }

    // Chart 2: Top Expenses Bar Chart
    const ctxTop = document.getElementById('topExpensesChart')?.getContext('2d');
    if (ctxTop) {
      if (this.charts.dashTop) this.charts.dashTop.destroy();

      const topSubs = [...this.subscriptions]
        .filter(s => s.status === 'Active')
        .sort((a, b) => {
          const valA = a.billingCycle === 'Yearly' ? a.price / 12 : a.price;
          const valB = b.billingCycle === 'Yearly' ? b.price / 12 : b.price;
          return valB - valA;
        })
        .slice(0, 5);

      this.charts.dashTop = new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: topSubs.map(s => s.name),
          datasets: [{
            label: 'Monthly Equivalent ($)',
            data: topSubs.map(s => (s.billingCycle === 'Yearly' ? s.price / 12 : s.price).toFixed(2)),
            backgroundColor: '#6366f1',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: isDark ? '#374151' : '#e5e7eb' } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  updateAnalyticsCharts() {
    if (typeof Chart === 'undefined') return;

    const isDark = this.theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#6b7280';

    // Chart 1: Cost Over Time Line Chart
    const ctxLine = document.getElementById('costOverTimeChart')?.getContext('2d');
    if (ctxLine) {
      if (this.charts.analyticsLine) this.charts.analyticsLine.destroy();

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const baseMonthly = parseFloat(this.getStats().totalMonthly);
      // Simulate minor fluctuation over past months
      const historicalData = months.map((m, idx) => (baseMonthly * (0.85 + (idx * 0.015))).toFixed(2));

      this.charts.analyticsLine = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Monthly Spending ($)',
            data: historicalData,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: isDark ? '#374151' : '#e5e7eb' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // Chart 2: Category Analytics Doughnut
    const ctxCat = document.getElementById('categoryAnalyticsChart')?.getContext('2d');
    if (ctxCat) {
      if (this.charts.analyticsCat) this.charts.analyticsCat.destroy();

      const catTotals = {};
      this.subscriptions.filter(s => s.status === 'Active').forEach(s => {
        const val = s.billingCycle === 'Yearly' ? s.price / 12 : s.price;
        catTotals[s.category] = (catTotals[s.category] || 0) + val;
      });

      this.charts.analyticsCat = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catTotals),
          datasets: [{
            data: Object.values(catTotals),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#f43f5e']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: textColor, font: { size: 10 } } } }
        }
      });
    }

    // Chart 3: Most Expensive Horizontal Bar
    const ctxHoriz = document.getElementById('mostExpensiveChart')?.getContext('2d');
    if (ctxHoriz) {
      if (this.charts.analyticsHoriz) this.charts.analyticsHoriz.destroy();

      const sorted = [...this.subscriptions]
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);

      this.charts.analyticsHoriz = new Chart(ctxHoriz, {
        type: 'bar',
        data: {
          labels: sorted.map(s => s.name),
          datasets: [{
            data: sorted.map(s => s.price),
            backgroundColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: isDark ? '#374151' : '#e5e7eb' } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // Chart 4: Active vs Inactive Donut
    const ctxActive = document.getElementById('activeVsInactiveChart')?.getContext('2d');
    if (ctxActive) {
      if (this.charts.analyticsActive) this.charts.analyticsActive.destroy();

      const activeCount = this.subscriptions.filter(s => s.status === 'Active').length;
      const pausedCount = this.subscriptions.filter(s => s.status === 'Paused').length;

      this.charts.analyticsActive = new Chart(ctxActive, {
        type: 'doughnut',
        data: {
          labels: ['Active Subscriptions', 'Paused / Inactive'],
          datasets: [{
            data: [activeCount, pausedCount],
            backgroundColor: ['#10b981', '#9ca3af']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 } } } }
        }
      });
    }
  }
}

// Instantiate and attach app to global window
window.app = new SubTrackApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
