/**
 * Tability API Client
 *
 * This module provides a typed HTTP client for the Tability API v2.
 * It handles authentication, request formatting, pagination parsing,
 * and error handling for all API endpoints.
 *
 * @see https://guides.tability.io/api/ for API documentation
 */

import type {
  User,
  Workspace,
  Membership,
  Plan,
  Objective,
  Outcome,
  Initiative,
  Checkin,
  PaginationHeaders,
  PaginatedResponse,
  PlanSearchFilter,
  ObjectiveSearchFilter,
  OutcomeSearchFilter,
  InitiativeSearchFilter,
} from '../types.js';

/** Base URL for Tability API v2 */
const API_BASE_URL = 'https://api.tability.app/v2';

/**
 * HTTP client for interacting with the Tability API.
 *
 * Provides methods for all supported API operations including:
 * - User and workspace management
 * - Membership CRUD operations
 * - Plans, objectives, outcomes, and initiatives
 * - Checkins (progress updates)
 * - Search functionality
 *
 * @example
 * ```typescript
 * const client = new TabilityClient('your-api-token');
 * const user = await client.whoami();
 * const plans = await client.getPlans('my-workspace');
 * ```
 */
export class TabilityClient {
  private apiToken: string;

  /**
   * Creates a new Tability API client.
   * @param apiToken - Personal API token from Tability account settings
   */
  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * Makes an authenticated request to the Tability API.
   *
   * @param endpoint - API endpoint path (e.g., "/whoami") or full URL
   * @param options - Fetch options (method, body, headers, etc.)
   * @returns Parsed JSON response
   * @throws Error if the API returns a non-2xx status code
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `API ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tability API error (${response.status}): ${errorText}`);
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Makes an authenticated request that returns paginated results.
   * Parses pagination headers (X-Per-Page, X-Page, X-Total) and Link header.
   *
   * @param endpoint - API endpoint path or full URL
   * @param options - Fetch options
   * @returns Object containing data array and pagination metadata
   * @throws Error if the API returns a non-2xx status code
   */
  private async requestWithPagination<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<PaginatedResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `API ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tability API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as T[];

    // Extract pagination info from response headers
    const pagination: PaginationHeaders = {
      perPage: parseInt(response.headers.get('X-Per-Page') || '25', 10),
      page: parseInt(response.headers.get('X-Page') || '1', 10),
      total: parseInt(response.headers.get('X-Total') || '0', 10),
    };

    // Parse Link header for next/prev page URLs
    // Format: <url>; rel="next", <url>; rel="prev"
    const linkHeader = response.headers.get('Link');
    if (linkHeader) {
      const links = linkHeader.split(',').map((link) => link.trim());
      for (const link of links) {
        const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
        if (match) {
          const [, linkUrl, rel] = match;
          if (rel === 'next' && linkUrl) pagination.nextUrl = linkUrl;
          if (rel === 'prev' && linkUrl) pagination.prevUrl = linkUrl;
        }
      }
    }

    return { data, pagination };
  }

  // ============== USER OPERATIONS ==============

  /**
   * Gets the authenticated user's profile.
   * @returns User profile including id, email, name, and timestamps
   */
  async whoami(): Promise<User> {
    return this.request<User>('/whoami');
  }

  // ============== WORKSPACE OPERATIONS ==============

  /**
   * Gets details of a specific workspace.
   * @param workspaceId - Workspace UUID or slug (e.g., "acme")
   * @returns Workspace details including name, URL, timezone
   */
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    return this.request<Workspace>(`/workspaces/${workspaceId}`);
  }

  // ============== MEMBERSHIP OPERATIONS ==============

  /**
   * Lists all memberships in a workspace with optional filtering.
   * @param workspaceId - Workspace UUID or slug
   * @param options - Optional filters: page, name/email search, role filter
   * @returns Paginated list of memberships
   */
  async getMemberships(
    workspaceId: string,
    options?: { page?: number; name?: string; role?: string }
  ): Promise<PaginatedResponse<Membership>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.name) params.set('name', options.name);
    if (options?.role) params.set('role', options.role);

    const query = params.toString();
    const endpoint = `/workspaces/${workspaceId}/memberships${query ? `?${query}` : ''}`;
    return this.requestWithPagination<Membership>(endpoint);
  }

  /**
   * Gets a specific membership by ID.
   * @param workspaceId - Workspace UUID or slug
   * @param membershipId - Membership UUID
   * @returns Full membership details including metrics
   */
  async getMembership(
    workspaceId: string,
    membershipId: string
  ): Promise<Membership> {
    return this.request<Membership>(
      `/workspaces/${workspaceId}/memberships/${membershipId}`
    );
  }

  /**
   * Gets the manager of a specific member.
   * @param workspaceId - Workspace UUID or slug
   * @param membershipId - Membership UUID
   * @returns Manager's membership or null if none assigned
   */
  async getMembershipManager(
    workspaceId: string,
    membershipId: string
  ): Promise<Membership | null> {
    return this.request<Membership | null>(
      `/workspaces/${workspaceId}/memberships/${membershipId}/manager`
    );
  }

  /**
   * Gets all direct reports of a member.
   * @param workspaceId - Workspace UUID or slug
   * @param membershipId - Membership UUID
   * @returns Array of memberships that report to this member
   */
  async getMembershipDirectReports(
    workspaceId: string,
    membershipId: string
  ): Promise<Membership[]> {
    return this.request<Membership[]>(
      `/workspaces/${workspaceId}/memberships/${membershipId}/direct_reports`
    );
  }

  /**
   * Updates a membership's role or manager.
   * @param workspaceId - Workspace UUID or slug
   * @param membershipId - Membership UUID to update
   * @param data - Fields to update (role and/or manager_id)
   * @returns Updated membership
   */
  async updateMembership(
    workspaceId: string,
    membershipId: string,
    data: { role?: string; manager_id?: string }
  ): Promise<Membership> {
    return this.request<Membership>(
      `/workspaces/${workspaceId}/memberships/${membershipId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Removes a member from the workspace.
   * This action cannot be undone.
   * @param workspaceId - Workspace UUID or slug
   * @param membershipId - Membership UUID to delete
   */
  async deleteMembership(
    workspaceId: string,
    membershipId: string
  ): Promise<void> {
    await this.request<void>(
      `/workspaces/${workspaceId}/memberships/${membershipId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Invites new users to the workspace by email.
   * Users will receive invitation emails.
   * @param workspaceId - Workspace UUID or slug
   * @param emails - Array of email addresses (max 50)
   * @returns Array of created memberships
   */
  async addMemberships(
    workspaceId: string,
    emails: string[]
  ): Promise<Membership[]> {
    return this.request<Membership[]>(
      `/workspaces/${workspaceId}/memberships/`,
      {
        method: 'POST',
        body: JSON.stringify({ emails }),
      }
    );
  }

  /**
   * Adds users as read-only members (free tier).
   * Users will receive invitation emails.
   * @param workspaceId - Workspace UUID or slug
   * @param emails - Array of email addresses (max 50)
   * @returns Array of created memberships
   */
  async addReadonlyMemberships(
    workspaceId: string,
    emails: string[]
  ): Promise<Membership[]> {
    return this.request<Membership[]>(
      `/workspaces/${workspaceId}/memberships/free`,
      {
        method: 'POST',
        body: JSON.stringify({ emails }),
      }
    );
  }

  // ============== PLAN OPERATIONS ==============

  /**
   * Lists all plans in a workspace.
   * @param workspaceId - Workspace UUID or slug
   * @param page - Optional page number for pagination
   * @returns Paginated list of plans with progress metrics
   */
  async getPlans(
    workspaceId: string,
    page?: number
  ): Promise<PaginatedResponse<Plan>> {
    const query = page ? `?page=${page}` : '';
    return this.requestWithPagination<Plan>(
      `/workspaces/${workspaceId}/plans${query}`
    );
  }

  /**
   * Gets a specific plan by ID.
   * @param workspaceId - Workspace UUID or slug
   * @param planId - Plan UUID or Nano ID
   * @returns Full plan details including dates and metrics
   */
  async getPlan(workspaceId: string, planId: string): Promise<Plan> {
    return this.request<Plan>(`/workspaces/${workspaceId}/plans/${planId}`);
  }

  // ============== OBJECTIVE OPERATIONS ==============

  /**
   * Gets all objectives for a specific plan.
   * @param workspaceId - Workspace UUID or slug
   * @param planId - Plan UUID or Nano ID
   * @returns Array of objectives with progress metrics
   */
  async getObjectivesForPlan(
    workspaceId: string,
    planId: string
  ): Promise<Objective[]> {
    return this.request<Objective[]>(
      `/workspaces/${workspaceId}/plans/${planId}/objectives`
    );
  }

  /**
   * Gets a specific objective by ID.
   * @param workspaceId - Workspace UUID or slug
   * @param objectiveId - Objective UUID or Nano ID
   * @returns Full objective details including parent plan
   */
  async getObjective(
    workspaceId: string,
    objectiveId: string
  ): Promise<Objective> {
    return this.request<Objective>(
      `/workspaces/${workspaceId}/objectives/${objectiveId}`
    );
  }

  // ============== OUTCOME OPERATIONS ==============

  /**
   * Gets all outcomes (key results) for a specific plan.
   * @param workspaceId - Workspace UUID or slug
   * @param planId - Plan UUID or Nano ID
   * @returns Array of outcomes with metrics and checkin data
   */
  async getOutcomesForPlan(
    workspaceId: string,
    planId: string
  ): Promise<Outcome[]> {
    return this.request<Outcome[]>(
      `/workspaces/${workspaceId}/plans/${planId}/outcomes`
    );
  }

  /**
   * Gets all outcomes for a specific objective.
   * @param workspaceId - Workspace UUID or slug
   * @param objectiveId - Objective UUID or Nano ID
   * @returns Array of outcomes with metrics and checkin data
   */
  async getOutcomesForObjective(
    workspaceId: string,
    objectiveId: string
  ): Promise<Outcome[]> {
    return this.request<Outcome[]>(
      `/workspaces/${workspaceId}/objectives/${objectiveId}/outcomes`
    );
  }

  /**
   * Gets a specific outcome by ID.
   * @param workspaceId - Workspace UUID or slug
   * @param outcomeId - Outcome UUID or Nano ID
   * @returns Full outcome details including from/to values and checkins
   */
  async getOutcome(workspaceId: string, outcomeId: string): Promise<Outcome> {
    return this.request<Outcome>(
      `/workspaces/${workspaceId}/outcomes/${outcomeId}`
    );
  }

  // ============== INITIATIVE OPERATIONS ==============

  /**
   * Gets all initiatives for a specific plan.
   * @param workspaceId - Workspace UUID or slug
   * @param planId - Plan UUID or Nano ID
   * @returns Array of initiatives with state and owner info
   */
  async getInitiativesForPlan(
    workspaceId: string,
    planId: string
  ): Promise<Initiative[]> {
    return this.request<Initiative[]>(
      `/workspaces/${workspaceId}/plans/${planId}/initiatives`
    );
  }

  /**
   * Gets all initiatives linked to a specific outcome.
   * @param workspaceId - Workspace UUID or slug
   * @param outcomeId - Outcome UUID or Nano ID
   * @returns Array of initiatives with state and owner info
   */
  async getInitiativesForOutcome(
    workspaceId: string,
    outcomeId: string
  ): Promise<Initiative[]> {
    return this.request<Initiative[]>(
      `/workspaces/${workspaceId}/outcomes/${outcomeId}/initiatives`
    );
  }

  /**
   * Gets a specific initiative by ID.
   * @param workspaceId - Workspace UUID or slug
   * @param initiativeId - Initiative UUID or Nano ID
   * @returns Full initiative details including body and due date
   */
  async getInitiative(
    workspaceId: string,
    initiativeId: string
  ): Promise<Initiative> {
    return this.request<Initiative>(
      `/workspaces/${workspaceId}/initiatives/${initiativeId}`
    );
  }

  // ============== CHECKIN OPERATIONS ==============

  /**
   * Gets all checkins (progress updates) for an outcome.
   * @param workspaceId - Workspace UUID or slug
   * @param outcomeId - Outcome UUID or Nano ID
   * @returns Array of checkins ordered by date
   */
  async getCheckinsForOutcome(
    workspaceId: string,
    outcomeId: string
  ): Promise<Checkin[]> {
    return this.request<Checkin[]>(
      `/workspaces/${workspaceId}/outcomes/${outcomeId}/checkins`
    );
  }

  /**
   * Gets a specific checkin by ID.
   * @param workspaceId - Workspace UUID or slug
   * @param checkinId - Checkin UUID or Nano ID
   * @returns Full checkin details including score and notes
   */
  async getCheckin(workspaceId: string, checkinId: string): Promise<Checkin> {
    return this.request<Checkin>(
      `/workspaces/${workspaceId}/checkins/${checkinId}`
    );
  }

  /**
   * Creates a new checkin (progress update) for an outcome.
   * @param workspaceId - Workspace UUID or slug
   * @param outcomeId - Outcome UUID or Nano ID to update
   * @param data - Checkin data (score required, others optional)
   * @returns Created checkin
   */
  async createCheckin(
    workspaceId: string,
    outcomeId: string,
    data: {
      score: number;
      checkin_date?: string;
      body?: string;
      confidence?: 'red' | 'yellow' | 'green';
    }
  ): Promise<Checkin> {
    return this.request<Checkin>(
      `/workspaces/${workspaceId}/outcomes/${outcomeId}/checkins`,
      {
        method: 'POST',
        body: JSON.stringify({
          checkin: {
            score: data.score,
            checkin_date: data.checkin_date,
            body: data.body,
            confidence: data.confidence,
          },
        }),
      }
    );
  }

  // ============== SEARCH OPERATIONS ==============

  /**
   * Searches plans with various filters.
   * @param workspaceId - Workspace UUID or slug
   * @param filter - Search filters (title, status, archived, etc.)
   * @param page - Optional page number
   * @returns Paginated list of matching plans
   */
  async searchPlans(
    workspaceId: string,
    filter: PlanSearchFilter,
    page?: number
  ): Promise<PaginatedResponse<Plan>> {
    return this.requestWithPagination<Plan>(
      `/workspaces/${workspaceId}/search/plans`,
      {
        method: 'POST',
        body: JSON.stringify({ filter, page }),
      }
    );
  }

  /**
   * Searches objectives with various filters.
   * @param workspaceId - Workspace UUID or slug
   * @param filter - Search filters (active status, dates, etc.)
   * @param page - Optional page number
   * @returns Paginated list of matching objectives
   */
  async searchObjectives(
    workspaceId: string,
    filter: ObjectiveSearchFilter,
    page?: number
  ): Promise<PaginatedResponse<Objective>> {
    return this.requestWithPagination<Objective>(
      `/workspaces/${workspaceId}/search/objectives`,
      {
        method: 'POST',
        body: JSON.stringify({ filter, page }),
      }
    );
  }

  /**
   * Searches outcomes with various filters.
   * @param workspaceId - Workspace UUID or slug
   * @param filter - Search filters (active status, dates, etc.)
   * @param page - Optional page number
   * @returns Paginated list of matching outcomes
   */
  async searchOutcomes(
    workspaceId: string,
    filter: OutcomeSearchFilter,
    page?: number
  ): Promise<PaginatedResponse<Outcome>> {
    return this.requestWithPagination<Outcome>(
      `/workspaces/${workspaceId}/search/outcomes`,
      {
        method: 'POST',
        body: JSON.stringify({ filter, page }),
      }
    );
  }

  /**
   * Searches initiatives with various filters.
   * @param workspaceId - Workspace UUID or slug
   * @param filter - Search filters (active status, dates, etc.)
   * @param page - Optional page number
   * @returns Paginated list of matching initiatives
   */
  async searchInitiatives(
    workspaceId: string,
    filter: InitiativeSearchFilter,
    page?: number
  ): Promise<PaginatedResponse<Initiative>> {
    return this.requestWithPagination<Initiative>(
      `/workspaces/${workspaceId}/search/initiatives`,
      {
        method: 'POST',
        body: JSON.stringify({ filter, page }),
      }
    );
  }
}

// ============== SINGLETON MANAGEMENT ==============

/** Singleton client instance */
let clientInstance: TabilityClient | null = null;

/**
 * Gets the singleton TabilityClient instance.
 * Initializes from TABILITY_API_TOKEN environment variable on first call.
 *
 * @returns Configured TabilityClient instance
 * @throws Error if TABILITY_API_TOKEN is not set
 */
export function getClient(): TabilityClient {
  if (!clientInstance) {
    const apiToken = process.env['TABILITY_API_TOKEN'];
    if (!apiToken) {
      throw new Error('TABILITY_API_TOKEN environment variable is required');
    }
    clientInstance = new TabilityClient(apiToken);
  }
  return clientInstance;
}

/**
 * Initializes the singleton client with a specific API token.
 * Useful for testing or when token is obtained dynamically.
 *
 * @param apiToken - Tability API token
 * @returns Configured TabilityClient instance
 */
export function initClient(apiToken: string): TabilityClient {
  clientInstance = new TabilityClient(apiToken);
  return clientInstance;
}
