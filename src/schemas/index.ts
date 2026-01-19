/**
 * Zod Validation Schemas for MCP Tool Parameters
 *
 * This module defines all input validation schemas used by the MCP server tools.
 * Each schema includes descriptions that are exposed to AI assistants for better
 * understanding of parameter requirements.
 *
 * @see https://zod.dev for Zod documentation
 */

import { z } from 'zod';

// ============== COMMON ID SCHEMAS ==============

/** Schema for workspace identifier (UUID or slug like "acme") */
export const workspaceIdSchema = z
  .string()
  .describe('The unique ID or slug of the workspace (e.g., "acme")');

/** Schema for plan identifier (UUID or Nano ID) */
export const planIdSchema = z
  .string()
  .describe('The plan ID (UUID or Nano ID format)');

/** Schema for objective identifier (UUID or Nano ID) */
export const objectiveIdSchema = z
  .string()
  .describe('The objective ID (UUID or Nano ID format)');

/** Schema for outcome/key result identifier (UUID or Nano ID) */
export const outcomeIdSchema = z
  .string()
  .describe('The outcome/key result ID (UUID or Nano ID format)');

/** Schema for initiative identifier (UUID or Nano ID) */
export const initiativeIdSchema = z
  .string()
  .describe('The initiative ID (UUID or Nano ID format)');

/** Schema for membership identifier (UUID only) */
export const membershipIdSchema = z
  .string()
  .describe('The membership ID (UUID format)');

/** Schema for checkin identifier (UUID or Nano ID) */
export const checkinIdSchema = z
  .string()
  .describe('The checkin ID (UUID or Nano ID format)');

/** Schema for pagination page number (optional, 1-indexed) */
export const pageSchema = z
  .number()
  .optional()
  .describe('Page number for pagination');

// ============== MEMBERSHIP SCHEMAS ==============

/** Schema for workspace membership roles */
export const membershipRoleSchema = z
  .enum(['owner', 'admin', 'user', 'readonly'])
  .describe('The role of the member in the workspace');

// ============== CHECKIN SCHEMAS ==============

/**
 * Schema for checkin confidence levels.
 * - red: Off-track, unlikely to achieve target
 * - yellow: At-risk, may need intervention
 * - green: On-track, confident in achieving target
 */
export const confidenceSchema = z
  .enum(['red', 'yellow', 'green'])
  .describe('Confidence level: red (off-track), yellow (at-risk), green (on-track)');

// ============== SEARCH FILTER SCHEMAS ==============

/**
 * Schema for plan search filters.
 * All fields are optional and can be combined.
 */
export const planSearchFilterSchema = z
  .object({
    title: z.string().optional().describe('Match plans by specific title'),
    children_of: z
      .string()
      .optional()
      .describe('Retrieve sub-plans using parent UUID or Nano ID'),
    archived: z
      .string()
      .optional()
      .describe('Filter by archived status ("true" or "false")'),
    status: z
      .enum(['active', 'planning'])
      .optional()
      .describe('"active" for in-progress plans, "planning" for future plans'),
    start_after: z
      .string()
      .optional()
      .describe('Plans beginning after specified date (ISO 8601 format)'),
  })
  .describe('Filters for searching plans');

/**
 * Schema for objective search filters.
 * All fields are optional and can be combined.
 */
export const objectiveSearchFilterSchema = z
  .object({
    is_in_progress: z
      .boolean()
      .optional()
      .describe('Return only objectives in active plans'),
    archived: z.boolean().optional().describe('Filter archived objectives'),
    start_at: z
      .string()
      .optional()
      .describe('Objectives in plans starting on/after date (ISO 8601)'),
    finish_at: z
      .string()
      .optional()
      .describe('Objectives in plans finishing on/before date (ISO 8601)'),
  })
  .describe('Filters for searching objectives');

/**
 * Schema for outcome search filters.
 * All fields are optional and can be combined.
 */
export const outcomeSearchFilterSchema = z
  .object({
    is_in_progress: z
      .boolean()
      .optional()
      .describe('Filter by active plan status'),
    archived: z.boolean().optional().describe('Archived outcome status'),
    start_at: z
      .string()
      .optional()
      .describe('Date-based filtering for start (ISO 8601)'),
    finish_at: z
      .string()
      .optional()
      .describe('Date-based filtering for finish (ISO 8601)'),
  })
  .describe('Filters for searching outcomes/key results');

/**
 * Schema for initiative search filters.
 * All fields are optional and can be combined.
 */
export const initiativeSearchFilterSchema = z
  .object({
    is_in_progress: z.boolean().optional().describe('Active plan filtering'),
    archived: z.boolean().optional().describe('Archived status'),
    start_at: z
      .string()
      .optional()
      .describe('Plan start date filtering (ISO 8601)'),
    finish_at: z
      .string()
      .optional()
      .describe('Plan finish date filtering (ISO 8601)'),
  })
  .describe('Filters for searching initiatives');

// ============== CHECKIN DATA SCHEMA ==============

/**
 * Schema for creating a new checkin.
 * Only score is required; other fields are optional.
 */
export const checkinDataSchema = z
  .object({
    score: z.number().describe('Current value/score for the outcome'),
    checkin_date: z
      .string()
      .optional()
      .describe(
        'Date of the checkin (ISO 8601 format). Defaults to current date if not provided'
      ),
    body: z.string().optional().describe('Analysis or notes about the progress'),
    confidence: confidenceSchema
      .optional()
      .describe('Confidence level for reaching the target'),
  })
  .describe('Data for creating a new checkin');

// ============== MEMBERSHIP MANAGEMENT SCHEMAS ==============

/**
 * Schema for adding new members by email.
 * Accepts 1-50 valid email addresses.
 */
export const emailsArraySchema = z
  .array(z.string().email())
  .min(1)
  .max(50)
  .describe('Array of email addresses (maximum 50 per request)');
