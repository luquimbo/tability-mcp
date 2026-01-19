/**
 * Tability API Type Definitions
 *
 * This module contains TypeScript interfaces for all Tability API entities.
 * These types are used throughout the MCP server for type safety and documentation.
 *
 * @see https://guides.tability.io/api/ for API documentation
 */

/**
 * Represents an authenticated user in Tability.
 * Returned by the /whoami endpoint.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** Full display name */
  name: string;
  /** First name */
  firstname: string;
  /** Last name */
  lastname: string;
  /** Timestamp when email was confirmed */
  confirmed_at: string;
  /** Timestamp when user was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
}

/**
 * Represents a Tability workspace.
 * Workspaces are the top-level organizational unit containing plans, members, etc.
 */
export interface Workspace {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name of the workspace */
  name: string;
  /** URL-friendly identifier (e.g., "acme") */
  slug: string;
  /** Full URL to the workspace */
  url: string;
  /** Timezone setting (e.g., "America/New_York") */
  time_zone: string;
  /** Timestamp when workspace was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
}

/**
 * Represents a user's membership in a workspace.
 * Contains role information and aggregated metrics for the member.
 */
export interface Membership {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the workspace this membership belongs to */
  workspace_id: string;
  /** ID of the user */
  user_id: string;
  /** Role level in the workspace */
  role: 'owner' | 'admin' | 'user' | 'readonly';
  /** Timestamp when membership was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
  /** Cached email address for quick access */
  cached_email: string;
  /** Cached first name */
  cached_firstname: string;
  /** Cached last name */
  cached_lastname: string;
  /** URL to user's avatar image */
  cached_avatar_url: string | null;
  /** Aggregated progress percentage across all outcomes */
  outcome_progress_prct: number;
  /** Aggregated progress percentage across all initiatives */
  initiative_progress_prct: number;
  /** Count of outcomes with red (off-track) status */
  red_outcomes_count: number;
  /** Count of outcomes with yellow (at-risk) status */
  yellow_outcomes_count: number;
  /** Count of outcomes with green (on-track) status */
  green_outcomes_count: number;
  /** Count of outcomes with grey (no checkin) status */
  grey_outcomes_count: number;
  /** Total number of outcomes assigned to this member */
  total_outcomes_count: number;
  /** Number of outcomes pending a checkin */
  pending_checkins_count: number;
  /** Net Confidence Score (-100 to 100) */
  ncs: number;
  /** Total number of initiatives */
  total_initiatives_count: number;
  /** Number of closed initiatives */
  closed_initiatives_count: number;
  /** ID of the member's manager (null if none) */
  manager_id: string | null;
}

/**
 * Represents a Plan (OKR cycle) in Tability.
 * Plans are time-bound containers for objectives (e.g., "Q1 2024 OKRs").
 */
export interface Plan {
  /** Unique identifier (UUID) */
  id: string;
  /** Plan title/name */
  title: string;
  /** ID of the workspace this plan belongs to */
  workspace_id: string;
  /** Short URL-friendly identifier */
  nano_slug: string;
  /** Start date of the plan period (ISO 8601) */
  start_at: string;
  /** End date of the plan period (ISO 8601) */
  finish_at: string;
  /** Publication state (draft, published, etc.) */
  state: string;
  /** Aggregated outcome progress (0-1) */
  outcome_progress_prct: number;
  /** Aggregated initiative progress (0-1) */
  initiative_progress_prct: number;
  /** Count of off-track outcomes */
  red_outcomes_count: number;
  /** Count of at-risk outcomes */
  yellow_outcomes_count: number;
  /** Count of on-track outcomes */
  green_outcomes_count: number;
  /** Count of outcomes without checkins */
  grey_outcomes_count: number;
  /** Total number of outcomes in this plan */
  total_outcomes_count: number;
  /** Total number of initiatives in this plan */
  total_initiatives_count: number;
  /** Number of completed initiatives */
  closed_initiatives_count: number;
  /** Whether the plan is archived */
  archived: boolean;
  /** Whether the plan is currently active (within date range) */
  active: boolean;
  /** Whether the plan period has ended */
  expired: boolean;
  /** Hour of day for reminder notifications (0-23) */
  reminders_hour: number;
  /** Reminder frequency interval */
  reminders_interval: string;
  /** Reminder period type (week, month, etc.) */
  reminders_period: string;
  /** Timestamp when plan was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
}

/**
 * Represents an Objective within a Plan.
 * Objectives are high-level goals that contain measurable outcomes (key results).
 */
export interface Objective {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the workspace */
  workspace_id: string;
  /** Short URL-friendly identifier */
  nano_slug: string;
  /** ID of the parent plan */
  plan_id: string;
  /** Objective title/name */
  title: string;
  /** Optional description text */
  description: string | null;
  /** List of tags applied to this objective */
  cached_tag_list: string[];
  /** Timestamp when objective was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
  /** Whether the objective is archived */
  archived: boolean;
  /** Aggregated outcome progress (0-1) */
  outcome_progress_prct: number;
  /** Aggregated initiative progress (0-1) */
  initiative_progress_prct: number;
  /** Total number of initiatives */
  total_initiatives_count: number;
  /** Number of completed initiatives */
  closed_initiatives_count: number;
  /** Count of outcomes without checkins */
  grey_outcomes_count: number;
  /** Count of off-track outcomes */
  red_outcomes_count: number;
  /** Count of at-risk outcomes */
  yellow_outcomes_count: number;
  /** Count of on-track outcomes */
  green_outcomes_count: number;
  /** Total number of outcomes */
  total_outcomes_count: number;
  /** Net Confidence Score (-100 to 100) */
  ncs: number;
  /** Parent plan details (included in some responses) */
  plan?: Plan;
}

/**
 * Represents a Checkin (progress update) for an Outcome.
 * Checkins record the current score, confidence level, and notes.
 */
export interface Checkin {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the workspace */
  workspace_id: string;
  /** ID of the outcome this checkin belongs to */
  outcome_id: string;
  /** Date of the checkin (ISO 8601) */
  checkin_date: string;
  /** Current score/value */
  score: number;
  /** Confidence level for reaching the target */
  confidence: 'red' | 'yellow' | 'green';
  /** Optional notes or analysis */
  body: string | null;
  /** Timestamp when checkin was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
  /** Member who created this checkin */
  membership: Membership;
}

/**
 * Represents an Outcome (Key Result) within an Objective.
 * Outcomes are measurable results with a starting value, target value, and progress tracking.
 */
export interface Outcome {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the workspace */
  workspace_id: string;
  /** Short URL-friendly identifier */
  nano_slug: string;
  /** ID of the parent objective */
  objective_id: string;
  /** Outcome title/name */
  title: string;
  /** Optional description text */
  description: string | null;
  /** Starting value for the metric */
  from: number;
  /** Target value to achieve */
  to: number;
  /** Display format for the score (e.g., "_number_%" or "$_number_") */
  score_format: string;
  /** Type of outcome metric */
  outcome_type: string;
  /** Timestamp when outcome was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
  /** Whether the outcome is archived */
  archived: boolean;
  /** Whether the outcome has been marked as completed */
  completed: boolean;
  /** Whether a checkin is pending/overdue */
  is_pending_checkin: boolean;
  /** Progress towards target (0-1) */
  outcome_progress_prct: number;
  /** Aggregated initiative progress (0-1) */
  initiative_progress_prct: number;
  /** Owner of this outcome */
  membership: Membership;
  /** Most recent checkin (null if none) */
  current_checkin: Checkin | null;
  /** Previous checkin for comparison (null if none) */
  previous_checkin: Checkin | null;
}

/**
 * Represents an Initiative (action item/project) linked to an Outcome.
 * Initiatives are the work items that drive progress on outcomes.
 */
export interface Initiative {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the workspace */
  workspace_id: string;
  /** Short URL-friendly identifier */
  nano_slug: string;
  /** ID of the parent outcome */
  outcome_id: string;
  /** Initiative title/name */
  title: string;
  /** Sort order rank */
  rank: number;
  /** Column position for kanban views */
  column_rank: number;
  /** Current state (open, closed, etc.) */
  state: string;
  /** Work status for tracking */
  work_state: 'planned' | 'backlog' | 'in_progress';
  /** Roadmap visibility state */
  roadmap_state: string;
  /** Timestamp when initiative was created */
  created_at: string;
  /** Timestamp of last update */
  updated_at: string;
  /** ID of the assigned member */
  membership_id: string;
  /** Timestamp when closed (null if open) */
  closed_at: string | null;
  /** Whether the initiative is archived */
  archived: boolean;
  /** Due date (null if not set) */
  due_at: string | null;
  /** Optional description/body text */
  body: string | null;
  /** List of tags applied to this initiative */
  cached_tag_list: string[];
  /** Assigned member details */
  membership: Membership;
}

// ============== SEARCH FILTER TYPES ==============

/**
 * Filter options for searching plans.
 */
export interface PlanSearchFilter {
  /** Match plans by exact title */
  title?: string;
  /** Get child plans of a specific parent (UUID or Nano ID) */
  children_of?: string;
  /** Filter by archived status ("true" or "false") */
  archived?: string;
  /** Filter by plan status */
  status?: 'active' | 'planning';
  /** Filter plans starting after this date (ISO 8601) */
  start_after?: string;
}

/**
 * Filter options for searching objectives.
 */
export interface ObjectiveSearchFilter {
  /** Only return objectives in active plans */
  is_in_progress?: boolean;
  /** Filter by archived status */
  archived?: boolean;
  /** Filter by plan start date (ISO 8601) */
  start_at?: string;
  /** Filter by plan end date (ISO 8601) */
  finish_at?: string;
}

/**
 * Filter options for searching outcomes.
 */
export interface OutcomeSearchFilter {
  /** Only return outcomes in active plans */
  is_in_progress?: boolean;
  /** Filter by archived status */
  archived?: boolean;
  /** Filter by plan start date (ISO 8601) */
  start_at?: string;
  /** Filter by plan end date (ISO 8601) */
  finish_at?: string;
}

/**
 * Filter options for searching initiatives.
 */
export interface InitiativeSearchFilter {
  /** Only return initiatives in active plans */
  is_in_progress?: boolean;
  /** Filter by archived status */
  archived?: boolean;
  /** Filter by plan start date (ISO 8601) */
  start_at?: string;
  /** Filter by plan end date (ISO 8601) */
  finish_at?: string;
}

// ============== PAGINATION TYPES ==============

/**
 * Pagination information extracted from API response headers.
 */
export interface PaginationHeaders {
  /** Number of items per page */
  perPage: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Total number of items across all pages */
  total: number;
  /** URL for the next page (if available) */
  nextUrl?: string;
  /** URL for the previous page (if available) */
  prevUrl?: string;
}

/**
 * Generic wrapper for paginated API responses.
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationHeaders;
}

// ============== ERROR TYPES ==============

/**
 * Structured error response from the Tability API.
 */
export interface TabilityApiError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Additional error details (if available) */
  details?: unknown;
}
