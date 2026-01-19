# Tability MCP Server

A Model Context Protocol (MCP) server for [Tability.app](https://tability.app) - the OKR and goal tracking platform.

This MCP server enables AI assistants like Claude to interact with your Tability workspace, allowing you to manage OKRs, track progress, and update checkins through natural language.

## Features

This MCP server provides **27 tools** covering all Tability API endpoints:

### User & Workspace
- `tability_whoami` - Get authenticated user profile
- `tability_get_workspace` - Get workspace details

### Memberships (Team Management)
- `tability_list_memberships` - List all workspace members with filtering
- `tability_get_membership` - Get specific member details
- `tability_get_membership_manager` - Get a member's manager
- `tability_get_membership_direct_reports` - Get direct reports
- `tability_update_membership` - Update member role or manager
- `tability_delete_membership` - Remove a member
- `tability_add_memberships` - Invite new users
- `tability_add_readonly_memberships` - Add read-only users (free tier)

### Plans
- `tability_list_plans` - List all plans with pagination
- `tability_get_plan` - Get specific plan details

### Objectives
- `tability_list_objectives_for_plan` - Get objectives in a plan
- `tability_get_objective` - Get specific objective details

### Outcomes (Key Results)
- `tability_list_outcomes_for_plan` - Get outcomes in a plan
- `tability_list_outcomes_for_objective` - Get outcomes for an objective
- `tability_get_outcome` - Get specific outcome details

### Initiatives
- `tability_list_initiatives_for_plan` - Get initiatives in a plan
- `tability_list_initiatives_for_outcome` - Get initiatives for an outcome
- `tability_get_initiative` - Get specific initiative details

### Checkins (Progress Updates)
- `tability_list_checkins_for_outcome` - Get checkin history
- `tability_get_checkin` - Get specific checkin details
- `tability_create_checkin` - Create a new progress update

### Search
- `tability_search_plans` - Search plans with filters
- `tability_search_objectives` - Search objectives with filters
- `tability_search_outcomes` - Search outcomes with filters
- `tability_search_initiatives` - Search initiatives with filters

## Installation

### Prerequisites
- Node.js 18 or higher
- A Tability account with API access enabled

### Getting Your API Token

1. Log into [Tability](https://tability.app)
2. Go to your [Account details](https://tability.app/account)
3. Copy your Personal API token
4. Ensure "API access" is enabled in each workspace you want to use

### Install from Source

```bash
# Clone the repository
git clone https://github.com/luquimbo/tability-mcp.git
cd tability-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### For Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tability": {
      "command": "node",
      "args": ["/absolute/path/to/tability-mcp/dist/index.js"],
      "env": {
        "TABILITY_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### For Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "tability": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/tability-mcp",
      "env": {
        "TABILITY_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TABILITY_API_TOKEN` | Yes | Your Tability Personal API token |

## Usage Examples

Once configured, you can interact with Tability through Claude:

**Get current user info:**
> "Who am I in Tability?"

**List all plans:**
> "Show me all OKR plans in my workspace 'acme'"

**Check progress on a plan:**
> "What's the progress on the Q1 2024 OKRs?"

**Create a checkin:**
> "Update the 'Revenue' outcome to 150000 with confidence green and note 'Great month!'"

**Search for initiatives:**
> "Find all active initiatives in progress"

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Test with MCP Inspector
npm run inspector
```

## API Documentation

This MCP server implements the [Tability API v2](https://guides.tability.io/api/).

Key concepts:
- **Plans**: Time-bound collections of objectives (e.g., "Q1 2024 OKRs")
- **Objectives**: High-level goals within a plan
- **Outcomes**: Measurable key results under each objective
- **Initiatives**: Actions/projects linked to outcomes
- **Checkins**: Progress updates with score, confidence, and notes

## Security Notes

- Keep your API token secure - never commit it to version control
- The API token has the same access level as your Tability user
- API access must be enabled per-workspace in Tability settings

## License

MIT
