#!/usr/bin/env node

/**
 * Tability MCP Server - HTTP Transport
 *
 * This module provides an HTTP server for the Tability MCP server,
 * compatible with remote MCP clients like ChatGPT, Langdock, etc.
 *
 * The server exposes the /mcp endpoint using the Streamable HTTP transport.
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { initClient } from './services/tability-client.js';
import { registerTools } from './tools.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
  exposedHeaders: ['mcp-session-id'],
}));

app.use(express.json());

// Store active transports by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

/**
 * Extract API token from request
 * Supports: Authorization header, query param, or config in body
 */
function extractApiToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check query parameter (for Smithery-style config)
  const configParam = req.query.config as string | undefined;
  if (configParam) {
    try {
      const config = JSON.parse(Buffer.from(configParam, 'base64').toString());
      if (config.apiToken) {
        return config.apiToken;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Check X-API-Token header
  const apiTokenHeader = req.headers['x-api-token'];
  if (typeof apiTokenHeader === 'string') {
    return apiTokenHeader;
  }

  return null;
}

/**
 * Create and configure the MCP server with all tools
 */
function createMcpServer(apiToken: string): McpServer {
  // Initialize the client with the provided token
  initClient(apiToken);

  const server = new McpServer({
    name: 'tability-mcp',
    version: '1.0.0',
  });

  // Register all tools
  registerTools(server);

  return server;
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'tability-mcp' });
});

// Root endpoint with info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Tability MCP Server',
    version: '1.0.0',
    description: 'MCP server for Tability.app - OKR and goal tracking platform',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    authentication: {
      methods: [
        'Authorization: Bearer <api_token>',
        'X-API-Token: <api_token>',
        'Query param: ?config=<base64_json>',
      ],
    },
  });
});

// MCP endpoint - handles all MCP protocol requests
app.all('/mcp', async (req: Request, res: Response) => {
  // Extract API token
  const apiToken = extractApiToken(req);

  if (!apiToken) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide your Tability API token via Authorization header (Bearer token), X-API-Token header, or config query parameter',
    });
    return;
  }

  // Get or validate session
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports.has(sessionId)) {
    // Reuse existing transport for this session
    transport = transports.get(sessionId)!;
  } else if (req.method === 'GET' || !sessionId) {
    // Create new transport for new session or SSE connection
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    // Create and connect MCP server
    const mcpServer = createMcpServer(apiToken);
    await mcpServer.server.connect(transport);

    // Store transport by session ID after connection
    if (transport.sessionId) {
      transports.set(transport.sessionId, transport);

      // Clean up on close
      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };
    }
  } else {
    // Invalid session ID
    res.status(404).json({
      error: 'Session not found',
      message: 'The specified session ID is invalid or has expired',
    });
    return;
  }

  // Handle the request
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// Handle DELETE for session cleanup
app.delete('/mcp', (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    transport.close();
    transports.delete(sessionId);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Tability MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
