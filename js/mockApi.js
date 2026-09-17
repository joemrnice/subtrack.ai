/**
 * SubTrack - Backend API Simulation & Data Layer
 *
 * ======================================================================================
 * ARCHITECTURE & PRODUCTION INTEGRATION NOTES
 * ======================================================================================
 *
 * 1. REST & GraphQL API Integration:
 *    In a production environment, this mock file would be replaced with an API service module
 *    (e.g., Axios instance or native `fetch` wrappers) making HTTPS requests to RESTful endpoints:
 *      - GET    /api/v1/subscriptions
 *      - POST   /api/v1/subscriptions
 *      - PUT    /api/v1/subscriptions/:id
 *      - DELETE /api/v1/subscriptions/:id
 *      - GET    /api/v1/transactions
 *      - GET    /api/v1/insights
 *    Or GraphQL queries/mutations against a GraphQL server (e.g., Apollo Server).
 *
 * 2. User Authentication & Authorization:
 *    - Modern JWT (JSON Web Tokens) or OAuth 2.0 with HttpOnly, Secure, SameSite cookies.
 *    - Authenticated headers: `Authorization: Bearer <JWT_TOKEN>`.
 *    - Identity providers support (Google OAuth, Apple Sign-In, Auth0).
 *
 * 3. Open Banking & Financial Integration:
 *    - Production integration with financial data aggregators like Plaid, Yodlee, or MX.
 *    - Syncing bank webhooks (e.g. `TRANSACTIONS_REMOVED`, `DEFAULT_UPDATE`) to automatically
 *      detect recurring payment patterns from raw transaction data.
 *    - Pattern recognition algorithms (ML / heuristics) to flag potential recurring subscription charges.
 *
 * 4. Persistent Storage & Database Schema:
 *    - Relational database like PostgreSQL or MySQL using Prisma / TypeORM / Drizzle.
 *    - Schemas: `Users`, `Subscriptions` (user_id, service_name, price_cents, cycle, category_id, renewal_date, status),
 *      `Transactions` (id, subscription_id, amount, date, status), `Categories`.
 *
 * 5. Security & Privacy Guidelines:
 *    - Strict PCI-DSS guidelines adherence where applicable (though SubTrack handles metadata, not card numbers directly).
 *    - NEVER request or collect real financial credentials (bank log-ins, SSNs, credit card numbers) in frontend code!
 *    - End-to-end encryption for sensitive metadata.
 * ======================================================================================
 */

// Initial Seed Data for Subscriptions
const INITIAL_SUBSCRIPTIONS = [
  {
    id: "sub-1",
    name: "Netflix",
    category: "Entertainment",
    price: 19.99,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(4), // 4 days from today
    status: "Active",
    icon: "film",
    color: "#e50914",
    description: "Premium 4K UHD 4-screen streaming plan",
    lastUsedDate: getRelativeDate(-2),
    createdAt: "2023-01-15"
  },
  {
    id: "sub-2",
    name: "ChatGPT Plus",
    category: "Software",
    price: 20.00,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(12),
    status: "Active",
    icon: "bot",
    color: "#10a37f",
    description: "OpenAI GPT-4o access & priority availability",
    lastUsedDate: getRelativeDate(0), // today
    createdAt: "2023-03-20"
  },
  {
    id: "sub-3",
    name: "Spotify Premium",
    category: "Entertainment",
    price: 11.99,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(8),
    status: "Active",
    icon: "music",
    color: "#1ed760",
    description: "Individual ad-free music streaming",
    lastUsedDate: getRelativeDate(-1),
    createdAt: "2022-06-10"
  },
  {
    id: "sub-4",
    name: "GitHub Pro",
    category: "Software",
    price: 4.00,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(18),
    status: "Active",
    icon: "github",
    color: "#2ea44f",
    description: "Pro developer tools, Copilot support & advanced storage",
    lastUsedDate: getRelativeDate(-1),
    createdAt: "2022-11-05"
  },
  {
    id: "sub-5",
    name: "Adobe Creative Cloud",
    category: "Productivity",
    price: 54.99,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(15),
    status: "Active",
    icon: "palette",
    color: "#ff0000",
    description: "All Apps Suite (Photoshop, Illustrator, Premiere)",
    lastUsedDate: getRelativeDate(-28), // Rarely used!
    createdAt: "2021-08-12"
  },
  {
    id: "sub-6",
    name: "Equinox Gym",
    category: "Fitness",
    price: 220.00,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(1),
    status: "Active",
    icon: "activity",
    color: "#111827",
    description: "All-access fitness club membership & classes",
    lastUsedDate: getRelativeDate(-35), // Unused flag candidate!
    createdAt: "2023-05-01"
  },
  {
    id: "sub-7",
    name: "iCloud+ 2TB",
    category: "Cloud storage",
    price: 9.99,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(22),
    status: "Active",
    icon: "cloud",
    color: "#007aff",
    description: "Family shared cloud storage and Private Relay",
    lastUsedDate: getRelativeDate(0),
    createdAt: "2020-04-18"
  },
  {
    id: "sub-8",
    name: "Notion Plus",
    category: "Productivity",
    price: 96.00,
    billingCycle: "Yearly",
    nextPaymentDate: getRelativeDate(120),
    status: "Active",
    icon: "file-text",
    color: "#000000",
    description: "Unlimited file uploads & version history",
    lastUsedDate: getRelativeDate(-3),
    createdAt: "2023-02-10"
  },
  {
    id: "sub-9",
    name: "Amazon Prime",
    category: "Shopping",
    price: 139.00,
    billingCycle: "Yearly",
    nextPaymentDate: getRelativeDate(210),
    status: "Active",
    icon: "shopping-bag",
    color: "#ff9900",
    description: "Free fast shipping & Prime Video",
    lastUsedDate: getRelativeDate(-5),
    createdAt: "2019-11-25"
  },
  {
    id: "sub-10",
    name: "Duolingo Super",
    category: "Education",
    price: 6.99,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(25),
    status: "Active",
    icon: "book-open",
    color: "#58cc02",
    description: "Ad-free language learning & unlimited hearts",
    lastUsedDate: getRelativeDate(-42), // Unused!
    createdAt: "2023-07-01"
  },
  {
    id: "sub-11",
    name: "AWS Infrastructure",
    category: "Cloud storage",
    price: 45.50,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(2),
    status: "Active",
    icon: "server",
    color: "#ff9900",
    description: "EC2 instances, S3 buckets and RDS Database",
    lastUsedDate: getRelativeDate(0),
    createdAt: "2022-09-14"
  },
  {
    id: "sub-12",
    name: "Xbox Game Pass Ultimate",
    category: "Entertainment",
    price: 16.99,
    billingCycle: "Monthly",
    nextPaymentDate: getRelativeDate(19),
    status: "Paused",
    icon: "gamepad-2",
    color: "#107c41",
    description: "Console and PC game library access",
    lastUsedDate: getRelativeDate(-60),
    createdAt: "2022-12-01"
  }
];

// Helper to generate ISO date offset from today
function getRelativeDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

// In-Memory Storage Simulation
class SubTrackMockService {
  constructor() {
    const saved = localStorage.getItem("subtrack_subscriptions_v1");
    if (saved) {
      try {
        this.subscriptions = JSON.parse(saved);
      } catch (e) {
        this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
      }
    } else {
      this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
      this._persist();
    }
  }

  _persist() {
    localStorage.setItem("subtrack_subscriptions_v1", JSON.stringify(this.subscriptions));
  }

  // Simulate network delay
  _delay(ms = 250) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * fetchSubscriptions()
   * Retrieves all subscription records
   */
  async fetchSubscriptions() {
    await this._delay();
    return [...this.subscriptions];
  }

  /**
   * fetchTransactions()
   * Retrieves recent financial transaction log
   */
  async fetchTransactions() {
    await this._delay();
    // Dynamically derive past transactions from active subscriptions
    const transactions = [];
    const today = new Date();

    this.subscriptions.forEach(sub => {
      // Create 2 past billing records for each sub
      const date1 = new Date(sub.nextPaymentDate);
      date1.setMonth(date1.getMonth() - 1);

      const date2 = new Date(sub.nextPaymentDate);
      date2.setMonth(date2.getMonth() - 2);

      transactions.push({
        id: `tx-${sub.id}-1`,
        subscriptionId: sub.id,
        serviceName: sub.name,
        category: sub.category,
        amount: sub.price,
        billingCycle: sub.billingCycle,
        date: date1.toISOString().split("T")[0],
        status: "Completed",
        paymentMethod: "Visa ending in •••• 4242"
      });

      transactions.push({
        id: `tx-${sub.id}-2`,
        subscriptionId: sub.id,
        serviceName: sub.name,
        category: sub.category,
        amount: sub.price,
        billingCycle: sub.billingCycle,
        date: date2.toISOString().split("T")[0],
        status: "Completed",
        paymentMethod: "Visa ending in •••• 4242"
      });
    });

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * createSubscription(data)
   * Creates a new subscription entry
   */
  async createSubscription(data) {
    await this._delay(300);
    const newSub = {
      id: `sub-${Date.now()}`,
      name: data.name || "New Service",
      category: data.category || "Software",
      price: parseFloat(data.price) || 0.00,
      billingCycle: data.billingCycle || "Monthly",
      nextPaymentDate: data.nextPaymentDate || getRelativeDate(30),
      status: data.status || "Active",
      icon: data.icon || "credit-card",
      color: data.color || "#6366f1",
      description: data.description || "Added manually",
      lastUsedDate: getRelativeDate(0),
      createdAt: new Date().toISOString().split("T")[0]
    };

    this.subscriptions.unshift(newSub);
    this._persist();
    return newSub;
  }

  /**
   * updateSubscription(id, data)
   * Updates an existing subscription
   */
  async updateSubscription(id, data) {
    await this._delay(300);
    const idx = this.subscriptions.findIndex(s => s.id === id);
    if (idx === -1) {
      throw new Error(`Subscription with ID ${id} not found.`);
    }

    this.subscriptions[idx] = {
      ...this.subscriptions[idx],
      ...data,
      price: data.price !== undefined ? parseFloat(data.price) : this.subscriptions[idx].price
    };

    this._persist();
    return this.subscriptions[idx];
  }

  /**
   * deleteSubscription(id)
   * Removes a subscription record
   */
  async deleteSubscription(id) {
    await this._delay(250);
    const initialLen = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
    if (this.subscriptions.length === initialLen) {
      throw new Error(`Subscription with ID ${id} not found.`);
    }
    this._persist();
    return { success: true, id };
  }

  /**
   * generateFinancialInsights()
   * Evaluates current subscriptions to produce simulated AI financial recommendations
   */
  async generateFinancialInsights() {
    await this._delay(350);
    const activeSubs = this.subscriptions.filter(s => s.status === "Active");

    // Identify unused or inactive subscriptions (last used > 25 days ago)
    const today = new Date();
    const unused = activeSubs.filter(s => {
      if (!s.lastUsedDate) return false;
      const diffDays = (today - new Date(s.lastUsedDate)) / (1000 * 3600 * 24);
      return diffDays >= 25;
    });

    // Calculate yearly costs vs monthly potential savings
    const softwareSubs = activeSubs.filter(s => s.category === "Software" || s.category === "Productivity");
    const softwareAnnualTotal = softwareSubs.reduce((acc, s) => {
      const monthlyVal = s.billingCycle === "Yearly" ? s.price / 12 : s.price;
      return acc + (monthlyVal * 12);
    }, 0);

    // Calculate potential savings from annual plan switches
    const monthlyEligibleForAnnual = activeSubs.filter(s => s.billingCycle === "Monthly" && s.price >= 10);
    const annualSwitchPotentialSavings = monthlyEligibleForAnnual.reduce((acc, s) => acc + (s.price * 12 * 0.20), 0); // 20% discount

    const unusedSavingsTotal = unused.reduce((acc, s) => {
      const monthlyVal = s.billingCycle === "Yearly" ? s.price / 12 : s.price;
      return acc + monthlyVal;
    }, 0);

    return {
      unusedCount: unused.length,
      unusedSubscriptions: unused,
      unusedMonthlySavingsPotential: unusedSavingsTotal.toFixed(2),
      softwareAnnualTotal: softwareAnnualTotal.toFixed(2),
      annualSwitchSavingsPotential: annualSwitchPotentialSavings.toFixed(2),
      recommendations: [
        {
          id: "rec-1",
          type: "warning",
          badge: "Unused Subscriptions",
          title: `${unused.length} subscription${unused.length === 1 ? '' : 's'} haven't been used recently`,
          description: `You could save $${unusedSavingsTotal.toFixed(2)}/mo by pausing services like ${unused.map(u => u.name).join(", ") || "Equinox Gym & Duolingo"} that show low usage in the past 30 days.`,
          actionLabel: "Review Unused Services",
          actionType: "FILTER_UNUSED"
        },
        {
          id: "rec-2",
          type: "info",
          badge: "Annual Software Spend",
          title: `Your annual software & productivity tools total $${softwareAnnualTotal.toFixed(2)}`,
          description: `Software represents a large portion of your recurring outflow. Consolidating overlapping utilities could optimize your tech stack.`,
          actionLabel: "Analyze Software Category",
          actionType: "FILTER_SOFTWARE"
        },
        {
          id: "rec-3",
          type: "success",
          badge: "Plan Optimization",
          title: `Switching selected plans to annual billing could save $${annualSwitchPotentialSavings.toFixed(2)}/yr`,
          description: `Most SaaS providers offer a ~15-20% discount on yearly billing cycles.`,
          actionLabel: "Explore Annual Switches",
          actionType: "VIEW_ANNUAL_PLANS"
        }
      ]
    };
  }

  /**
   * Reset data back to default preset
   */
  async resetToDefaults() {
    this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
    this._persist();
    return [...this.subscriptions];
  }
}

// Export singleton instance
window.mockApi = new SubTrackMockService();
