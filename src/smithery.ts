#!/usr/bin/env node

/**
 * Tability MCP Server - Smithery Entry Point
 *
 * This module exports a createServer function compatible with Smithery's
 * TypeScript runtime for HTTP transport deployment.
 *
 * @see https://smithery.ai/docs for Smithery documentation
 * @see https://tability.app for more about Tability
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TabilityClient } from './services/tability-client.js';
import {
  workspaceIdSchema,
  planIdSchema,
  objectiveIdSchema,
  outcomeIdSchema,
  initiativeIdSchema,
  membershipIdSchema,
  checkinIdSchema,
  pageSchema,
  membershipRoleSchema,
  planSearchFilterSchema,
  objectiveSearchFilterSchema,
  outcomeSearchFilterSchema,
  initiativeSearchFilterSchema,
  emailsArraySchema,
  confidenceSchema,
} from './schemas/index.js';

/**
 * Configuration schema for Smithery
 */
export const configSchema = z.object({
  apiToken: z.string().describe('Your Tability API token'),
});

/**
 * Formats API response data for output.
 */
function formatResponse(
  data: unknown,
  format: 'json' | 'markdown' = 'json'
): string {
  if (format === 'markdown') {
    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Creates a configured MCP server for Smithery deployment.
 *
 * @param config - Configuration object containing the API token
 * @returns Configured MCP server instance
 */
export default function createServer(config: z.infer<typeof configSchema>) {
  const client = new TabilityClient(config.apiToken);

  const server = new McpServer({
    name: 'tability-mcp',
    version: '1.0.0',
  });

  // ============== USER TOOLS ==============

  server.tool(
    'tability_whoami',
    'Get the profile of the authenticated user associated with the API token. Returns user details including id, email, name, and timestamps.',
    {},
    async () => {
      try {
        const user = await client.whoami();
        return {
          content: [{ type: 'text', text: formatResponse(user) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== WORKSPACE TOOLS ==============

  server.tool(
    'tability_get_workspace',
    'Get details of a specific workspace by its ID or slug. Returns workspace info including name, URL, timezone, and timestamps.',
    {
      workspace_id: workspaceIdSchema,
    },
    async ({ workspace_id }) => {
      try {
        const workspace = await client.getWorkspace(workspace_id);
        return {
          content: [{ type: 'text', text: formatResponse(workspace) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== MEMBERSHIP TOOLS ==============

  server.tool(
    'tability_list_memberships',
    'List all memberships in a workspace with optional filtering by name/email or role. Returns paginated results with member details, progress metrics, and outcome counts.',
    {
      workspace_id: workspaceIdSchema,
      page: pageSchema,
      name: z.string().optional().describe('Filter by name or email'),
      role: membershipRoleSchema.optional(),
    },
    async ({ workspace_id, page, name, role }) => {
      try {
        const result = await client.getMemberships(workspace_id, {
          page,
          name,
          role,
        });
        return {
          content: [{ type: 'text', text: formatResponse(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_membership',
    'Get details of a specific membership by its ID. Returns full member information including role, progress metrics, and outcome/initiative counts.',
    {
      workspace_id: workspaceIdSchema,
      membership_id: membershipIdSchema,
    },
    async ({ workspace_id, membership_id }) => {
      try {
        const membership = await client.getMembership(workspace_id, membership_id);
        return {
          content: [{ type: 'text', text: formatResponse(membership) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_membership_manager',
    "Get the manager of a specific membership. Returns the manager's membership details or null if no manager is assigned.",
    {
      workspace_id: workspaceIdSchema,
      membership_id: membershipIdSchema,
    },
    async ({ workspace_id, membership_id }) => {
      try {
        const manager = await client.getMembershipManager(
          workspace_id,
          membership_id
        );
        return {
          content: [
            {
              type: 'text',
              text: formatResponse(manager ?? { message: 'No manager assigned' }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_membership_direct_reports',
    'Get all direct reports of a specific membership. Returns an array of memberships that report to this member.',
    {
      workspace_id: workspaceIdSchema,
      membership_id: membershipIdSchema,
    },
    async ({ workspace_id, membership_id }) => {
      try {
        const reports = await client.getMembershipDirectReports(
          workspace_id,
          membership_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(reports) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_update_membership',
    "Update a membership's role or manager. Requires at least one of role or manager_id to be provided.",
    {
      workspace_id: workspaceIdSchema,
      membership_id: membershipIdSchema,
      role: membershipRoleSchema.optional(),
      manager_id: z.string().optional().describe('ID of the manager membership'),
    },
    async ({ workspace_id, membership_id, role, manager_id }) => {
      try {
        const data: { role?: string; manager_id?: string } = {};
        if (role) data.role = role;
        if (manager_id) data.manager_id = manager_id;

        const membership = await client.updateMembership(
          workspace_id,
          membership_id,
          data
        );
        return {
          content: [{ type: 'text', text: formatResponse(membership) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_delete_membership',
    'Remove a membership from the workspace. This action cannot be undone.',
    {
      workspace_id: workspaceIdSchema,
      membership_id: membershipIdSchema,
    },
    async ({ workspace_id, membership_id }) => {
      try {
        await client.deleteMembership(workspace_id, membership_id);
        return {
          content: [
            {
              type: 'text',
              text: formatResponse({
                success: true,
                message: 'Membership deleted successfully',
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_add_memberships',
    'Add new users to the workspace by email. Maximum 50 emails per request. Users will receive an invitation email.',
    {
      workspace_id: workspaceIdSchema,
      emails: emailsArraySchema,
    },
    async ({ workspace_id, emails }) => {
      try {
        const memberships = await client.addMemberships(workspace_id, emails);
        return {
          content: [{ type: 'text', text: formatResponse(memberships) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_add_readonly_memberships',
    'Add new users as read-only members (free tier). Maximum 50 emails per request. Users will receive an invitation email.',
    {
      workspace_id: workspaceIdSchema,
      emails: emailsArraySchema,
    },
    async ({ workspace_id, emails }) => {
      try {
        const memberships = await client.addReadonlyMemberships(
          workspace_id,
          emails
        );
        return {
          content: [{ type: 'text', text: formatResponse(memberships) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== PLAN TOOLS ==============

  server.tool(
    'tability_list_plans',
    'List all plans in a workspace. Returns paginated results with plan details including progress metrics, outcome counts, and status indicators.',
    {
      workspace_id: workspaceIdSchema,
      page: pageSchema,
    },
    async ({ workspace_id, page }) => {
      try {
        const result = await client.getPlans(workspace_id, page);
        return {
          content: [{ type: 'text', text: formatResponse(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_plan',
    'Get details of a specific plan by its ID (UUID or Nano ID). Returns full plan information including title, dates, progress, and outcome/initiative counts.',
    {
      workspace_id: workspaceIdSchema,
      plan_id: planIdSchema,
    },
    async ({ workspace_id, plan_id }) => {
      try {
        const plan = await client.getPlan(workspace_id, plan_id);
        return {
          content: [{ type: 'text', text: formatResponse(plan) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== OBJECTIVE TOOLS ==============

  server.tool(
    'tability_list_objectives_for_plan',
    'Get all objectives for a specific plan. Returns objectives with their titles, descriptions, progress metrics, and outcome counts.',
    {
      workspace_id: workspaceIdSchema,
      plan_id: planIdSchema,
    },
    async ({ workspace_id, plan_id }) => {
      try {
        const objectives = await client.getObjectivesForPlan(
          workspace_id,
          plan_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(objectives) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_objective',
    'Get details of a specific objective by its ID (UUID or Nano ID). Returns full objective information including the parent plan details.',
    {
      workspace_id: workspaceIdSchema,
      objective_id: objectiveIdSchema,
    },
    async ({ workspace_id, objective_id }) => {
      try {
        const objective = await client.getObjective(workspace_id, objective_id);
        return {
          content: [{ type: 'text', text: formatResponse(objective) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== OUTCOME TOOLS ==============

  server.tool(
    'tability_list_outcomes_for_plan',
    'Get all outcomes (key results) for a specific plan. Returns outcomes with metrics, progress, owner info, and current/previous checkins.',
    {
      workspace_id: workspaceIdSchema,
      plan_id: planIdSchema,
    },
    async ({ workspace_id, plan_id }) => {
      try {
        const outcomes = await client.getOutcomesForPlan(workspace_id, plan_id);
        return {
          content: [{ type: 'text', text: formatResponse(outcomes) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_list_outcomes_for_objective',
    'Get all outcomes (key results) for a specific objective. Returns outcomes with metrics, progress, owner info, and current/previous checkins.',
    {
      workspace_id: workspaceIdSchema,
      objective_id: objectiveIdSchema,
    },
    async ({ workspace_id, objective_id }) => {
      try {
        const outcomes = await client.getOutcomesForObjective(
          workspace_id,
          objective_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(outcomes) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_outcome',
    'Get details of a specific outcome (key result) by its ID. Returns full outcome info including metrics (from/to), progress, owner, and checkin data.',
    {
      workspace_id: workspaceIdSchema,
      outcome_id: outcomeIdSchema,
    },
    async ({ workspace_id, outcome_id }) => {
      try {
        const outcome = await client.getOutcome(workspace_id, outcome_id);
        return {
          content: [{ type: 'text', text: formatResponse(outcome) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== INITIATIVE TOOLS ==============

  server.tool(
    'tability_list_initiatives_for_plan',
    'Get all initiatives for a specific plan. Returns initiatives with their states, owners, due dates, and work status.',
    {
      workspace_id: workspaceIdSchema,
      plan_id: planIdSchema,
    },
    async ({ workspace_id, plan_id }) => {
      try {
        const initiatives = await client.getInitiativesForPlan(
          workspace_id,
          plan_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(initiatives) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_list_initiatives_for_outcome',
    'Get all initiatives linked to a specific outcome. Returns initiatives with their states, owners, due dates, and work status.',
    {
      workspace_id: workspaceIdSchema,
      outcome_id: outcomeIdSchema,
    },
    async ({ workspace_id, outcome_id }) => {
      try {
        const initiatives = await client.getInitiativesForOutcome(
          workspace_id,
          outcome_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(initiatives) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_initiative',
    'Get details of a specific initiative by its ID. Returns full initiative info including title, body, state, work_state, owner, and due date.',
    {
      workspace_id: workspaceIdSchema,
      initiative_id: initiativeIdSchema,
    },
    async ({ workspace_id, initiative_id }) => {
      try {
        const initiative = await client.getInitiative(
          workspace_id,
          initiative_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(initiative) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== CHECKIN TOOLS ==============

  server.tool(
    'tability_list_checkins_for_outcome',
    'Get all checkins (progress updates) for a specific outcome. Returns checkins with scores, confidence levels, notes, and author info.',
    {
      workspace_id: workspaceIdSchema,
      outcome_id: outcomeIdSchema,
    },
    async ({ workspace_id, outcome_id }) => {
      try {
        const checkins = await client.getCheckinsForOutcome(
          workspace_id,
          outcome_id
        );
        return {
          content: [{ type: 'text', text: formatResponse(checkins) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_get_checkin',
    'Get details of a specific checkin by its ID. Returns full checkin info including score, confidence, notes, and author.',
    {
      workspace_id: workspaceIdSchema,
      checkin_id: checkinIdSchema,
    },
    async ({ workspace_id, checkin_id }) => {
      try {
        const checkin = await client.getCheckin(workspace_id, checkin_id);
        return {
          content: [{ type: 'text', text: formatResponse(checkin) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_create_checkin',
    'Create a new checkin (progress update) for an outcome. Requires the current score value. Optionally include date, notes, and confidence level.',
    {
      workspace_id: workspaceIdSchema,
      outcome_id: outcomeIdSchema,
      score: z.number().describe('Current value/score for the outcome'),
      checkin_date: z
        .string()
        .optional()
        .describe('Date of the checkin (ISO 8601 format). Defaults to current date'),
      body: z.string().optional().describe('Analysis or notes about the progress'),
      confidence: confidenceSchema.optional(),
    },
    async ({ workspace_id, outcome_id, score, checkin_date, body, confidence }) => {
      try {
        const checkin = await client.createCheckin(workspace_id, outcome_id, {
          score,
          checkin_date,
          body,
          confidence,
        });
        return {
          content: [{ type: 'text', text: formatResponse(checkin) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============== SEARCH TOOLS ==============

  server.tool(
    'tability_search_plans',
    'Search plans in a workspace with various filters. Can filter by title, parent plan, archived status, active/planning status, and start date.',
    {
      workspace_id: workspaceIdSchema,
      filter: planSearchFilterSchema,
      page: pageSchema,
    },
    async ({ workspace_id, filter, page }) => {
      try {
        const result = await client.searchPlans(workspace_id, filter, page);
        return {
          content: [{ type: 'text', text: formatResponse(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_search_objectives',
    'Search objectives in a workspace with various filters. Can filter by active status, archived status, and date ranges.',
    {
      workspace_id: workspaceIdSchema,
      filter: objectiveSearchFilterSchema,
      page: pageSchema,
    },
    async ({ workspace_id, filter, page }) => {
      try {
        const result = await client.searchObjectives(workspace_id, filter, page);
        return {
          content: [{ type: 'text', text: formatResponse(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_search_outcomes',
    'Search outcomes (key results) in a workspace with various filters. Can filter by active status, archived status, and date ranges.',
    {
      workspace_id: workspaceIdSchema,
      filter: outcomeSearchFilterSchema,
      page: pageSchema,
    },
    async ({ workspace_id, filter, page }) => {
      try {
        const result = await client.searchOutcomes(workspace_id, filter, page);
        return {
          content: [{ type: 'text', text: formatResponse(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'tability_search_initiatives',
    'Search initiatives in a workspace with various filters. Can filter by active status, archived status, and date ranges.',
    {
      workspace_id: workspaceIdSchema,
      filter: initiativeSearchFilterSchema,
      page: pageSchema,
    },
    async ({ workspace_id, filter, page }) => {
      try {
        const result = await client.searchInitiatives(workspace_id, filter, page);
        return {
          content: [{ type: 'text', text: formatResponse(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Return the underlying server for Smithery
  return server.server;
}
