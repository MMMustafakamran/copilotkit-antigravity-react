# Build with agents

> Give your AI coding agent up-to-date knowledge of CopilotKit's APIs, patterns, and best practices.

AI coding agents may not have up-to-date knowledge of CopilotKit's APIs, patterns, and best practices. The resources on this page give them accurate, current knowledge directly in their context.

## CopilotKit Skills [#copilotkit-skills]

Skills are folders of instructions that coding agents discover and use automatically. The CopilotKit skills are short. They do not copy the API. They tell your agent where to find the current answer: these docs, the source, and the CLI. A copy of an API goes stale. A search does not.

<Callout type="info">
  Skills are the recommended way to give your agent CopilotKit knowledge. They work natively in Claude Code, Cursor, Codex, Gemini CLI, and any tool supporting the [agentskills.io](https://agentskills.io) standard.
</Callout>

There are two:

| Skill | Use it to |
| --- | --- |
| `copilotkit` | Answer any CopilotKit question from current docs and source. It fetches the docs as Markdown, and uses the `copilotkit-docs` MCP server when the plugin provides it |
| `copilotkit-cli` | Drive the CLI: scaffold a project, connect Intelligence, and prove a project's wiring with `copilotkit verify` before debugging by hand |

You don't need to pick between them. Your agent loads whichever fits the task. The [skills directory](https://github.com/CopilotKit/CopilotKit/tree/main/skills) also holds a few procedure skills, such as setting up a Slack Channel, which walk through steps that span several systems.

<Steps>
  <Step>
    ### Install the skills [#install-the-skills]

    Run this from the root of the project you're building in:

    ```bash
    npx skills add CopilotKit/CopilotKit/skills -y
    ```

    This installs the skills into your project, where any coding agent working there (Claude Code, Codex, Cursor, or Gemini CLI) discovers them automatically. There's no per-agent configuration to do.

    <Callout type="info">
      Want to choose what gets installed? Run `npx skills add CopilotKit/CopilotKit/skills` without `-y` to pick specific skills, target agents, and scope interactively. To install globally for every project, add `-g`.
    </Callout>

  </Step>
  <Step>
    ### Start building [#start-building]

    Open a new agent session and use a starter prompt to put the skills to work: `Help me add CopilotKit to this app. Look up the current setup in the CopilotKit docs first.`

    Your agent searches the documentation rather than working from memory, and reaches for `copilotkit verify` when something doesn't work.
  </Step>
</Steps>

## MCP Docs Server [#mcp-docs-server]

The CopilotKit MCP server equips AI coding agents with deep knowledge about CopilotKit's APIs, patterns, and best practices. When connected to your
development environment, it enables AI assistants to:

- Provide expert guidance
- Generate accurate code
- Give your AI agents a user interface
- Help you implement CopilotKit features correctly

Pick your coding tool, then follow its steps:

<Tabs groupId="coding-agent" items={['Cursor', 'Claude Web', 'Claude Desktop', 'Claude Code', 'Windsurf', 'Cline', 'GitHub Copilot', 'Codex', 'Other']} default="Cursor" persist>

<Tab value="Cursor">

[Cursor](https://cursor.sh/) reads MCP servers from an `mcp.json` file.

<Steps>
  <Step>
    ### Open MCP Settings in Cursor [#open-mcp-settings-in-cursor]
    1. Press `Shift+Command+J` (Mac) or `Shift+Ctrl+J` (Windows/Linux) to open Cursor's settings.
    2. Look for "MCP Tools" in the left sidebar categories.
    3. Click "Add Custom MCP".
    This will open the mcp.json file in the editor, which you need to edit.

    This screen opens the global `~/.cursor/mcp.json`, which registers the server for every
    project you open. To register it for this project alone, create `.cursor/mcp.json` at
    the project root instead and put the same configuration there.
  </Step>
  <Step>
    ### Add MCP Server to Cursor [#add-mcp-server-to-cursor]
    Copy CopilotKit MCP's configuration and paste it under the mcpServers key in the mcp.json file.

    <Tabs groupId="transport" items={['HTTP', 'SSE']} default="HTTP">
      <Tab value="HTTP">
        ```json
        {
          "mcpServers": {
            "CopilotKit MCP": {
              "url": "https://mcp.copilotkit.ai/mcp"
            }
          }
        }
        ```
      </Tab>
      <Tab value="SSE">
        ```json
        {
          "mcpServers": {
            "CopilotKit MCP": {
              "url": "https://mcp.copilotkit.ai/sse"
            }
          }
        }
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step>
    ### Test the connection [#test-the-connection]
    Ask your agent: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.`

    A successful tool call returns documentation results.
  </Step>
</Steps>

</Tab>

<Tab value="Claude Web">

[Claude](https://claude.ai/) calls MCP servers Connectors.

<Steps>
  <Step>
    Open the [Connectors](https://claude.ai/settings/connectors) settings page in Claude:

    1. Click your user in the bottom left of the chat box, then select "Settings".
    2. In the left menu of the Settings page, select "Connectors".
  </Step>
  <Step>Click "Add custom connector"</Step>
  <Step>
    Fill in the connector:

    1. In the Name field, enter `CopilotKit`.
    2. In the URL field, enter `https://mcp.copilotkit.ai/sse`.
  </Step>
  <Step>Click "Add"</Step>
  <Step>
    Ask Claude: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.` A successful tool call returns documentation results.
  </Step>
</Steps>

</Tab>

<Tab value="Claude Desktop">

[Claude Desktop](https://claude.ai/download) calls MCP servers Connectors.

<div className="-mt-2 text-sm text-muted-foreground">
  These steps are the same as those for Claude Web, above. The only difference
  is that the Connectors link below navigates to the Connectors settings in the
  Claude desktop app, instead of the Claude web app.
</div>

<Steps>
  <Step>
    Open the [Connectors](claude://claude.ai/settings/connectors) settings page in Claude:

    1. Click your user in the bottom left of the chat box, then select "Settings".
    2. In the left menu of the Settings page, select "Connectors".
  </Step>
  <Step>Click "Add custom connector"</Step>
  <Step>
    Fill in the connector:

    1. In the Name field, enter `CopilotKit`.
    2. In the URL field, enter `https://mcp.copilotkit.ai/sse`.
  </Step>
  <Step>Click "Add"</Step>
  <Step>
    Ask Claude: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.` A successful tool call returns documentation results.
  </Step>
</Steps>

</Tab>

<Tab value="Claude Code">

[Claude Code](https://docs.claude.com/en/docs/claude-code) adds MCP servers from its CLI.

<Steps>
  <Step>
    ### Add MCP Server to Claude Code [#add-mcp-server-to-claude-code]
    Use the Claude Code CLI to add the CopilotKit MCP server:

    ```bash
    claude mcp add --transport sse copilotkit-mcp https://mcp.copilotkit.ai/sse --scope project
    ```

    **Expected Output:**
    ```
    Added SSE MCP server copilotkit-mcp with URL: https://mcp.copilotkit.ai/sse to project config
    File modified: /path/to/your/project/.mcp.json
    ```

    `--scope project` writes `.mcp.json` at the root of your project, so the server is
    registered for everyone who checks the repository out. Without the flag, the command
    uses `local` scope. That scope writes `~/.claude.json` in your home directory, and only
    you get the server. A coding agent that runs unattended usually cannot change files
    outside the project.

  </Step>
  <Step>
    ### Verify Connection [#verify-connection]
    Check that the server is properly connected:

    ```bash
    claude mcp list
    ```

    **Expected Output:**
    ```
    Checking MCP server health...

    copilotkit-mcp: https://mcp.copilotkit.ai/sse (SSE) - ✓ Connected
    ```

    <div className="mt-4 p-4 rounded-lg bg-muted">
      <div className="font-medium text-sm mb-2">Server Name Requirements</div>
      <div className="text-sm text-muted-foreground">
        Server names can only contain letters, numbers, hyphens, and underscores. Avoid spaces in server names.
      </div>
    </div>

  </Step>
  <Step>
    ### Using MCP Tools in Claude Code [#using-mcp-tools-in-claude-code]
    Once configured, the CopilotKit MCP server tools are automatically available when you interact with Claude Code for CopilotKit-related development tasks.

    **Management Commands:**
    ```bash
    # View server details
    claude mcp get copilotkit-mcp

    # Remove server if needed
    claude mcp remove copilotkit-mcp -s project
    ```

  </Step>
</Steps>

</Tab>

<Tab value="Windsurf">

[Windsurf](https://codeium.com/windsurf) uses MCP servers in its Cascade assistant.

<Steps>
  <Step>
    ### Access Windsurf MCP Settings [#access-windsurf-mcp-settings]
    1. Open Windsurf Settings (click the settings button in the bottom right)
    2. Navigate to the "Cascade" section
    3. Look for "Model Context Protocol" or "MCP" settings
    4. Enable MCP support if not already enabled
  </Step>
  <Step>
    ### Add MCP Server to Windsurf [#add-mcp-server-to-windsurf]
    You can add CopilotKit MCP in several ways:

    <Tabs groupId="windsurf-setup" items={['Using the Built-in Server Browser', 'Manual Configuration']} default="Using the Built-in Server Browser">
      <Tab value="Using the Built-in Server Browser">
        1. In the Cascade section, click "Add Server"
        2. Select "Add custom server"
        3. Choose the transport type:
           - **SSE/HTTP** for remote servers
           - **stdio** for local command-based servers
      </Tab>
      <Tab value="Manual Configuration">
        Add the server configuration to your mcp_config.json file:

        <Tabs groupId="windsurf-transport" items={['HTTP Transport', 'SSE Transport', 'stdio Transport (Local)']} default="HTTP Transport">
          <Tab value="HTTP Transport">
            ```json
            {
              "mcpServers": {
                "CopilotKit MCP": {
                  "url": "https://mcp.copilotkit.ai/mcp",
                  "disabled": false,
                  "timeout": 30
                }
              }
            }
            ```
          </Tab>
          <Tab value="SSE Transport">
            ```json
            {
              "mcpServers": {
                "CopilotKit MCP": {
                  "url": "https://mcp.copilotkit.ai/sse",
                  "disabled": false,
                  "timeout": 30
                }
              }
            }
            ```
          </Tab>
          <Tab value="stdio Transport (Local)">
            ```json
            {
              "mcpServers": {
                "CopilotKit MCP": {
                  "command": "npx",
                  "args": ["-y", "mcp-remote", "https://mcp.copilotkit.ai/mcp"]
                }
              }
            }
            ```
          </Tab>
        </Tabs>
      </Tab>
    </Tabs>

  </Step>
  <Step>
    ### Configuration File Location [#configuration-file-location]
    The MCP configuration is typically stored at:

    <Tabs groupId="windsurf-os" items={['macOS', 'Windows', 'Linux']} default="macOS">
      <Tab value="macOS">
        ```
        ~/.codeium/windsurf/mcp_config.json
        ```
      </Tab>
      <Tab value="Windows">
        ```
        %APPDATA%\.codeium\windsurf\mcp_config.json
        ```
      </Tab>
      <Tab value="Linux">
        ```
        ~/.config/codeium/windsurf/mcp_config.json
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step>
    ### Using MCP Tools in Windsurf [#using-mcp-tools-in-windsurf]
    Once configured, CopilotKit MCP tools will be available in Windsurf's Cascade AI assistant:

    - Open the Cascade panel (AI chat interface)
    - The MCP tools are automatically available to the AI
    - You can reference specific tools using `@CopilotKit MCP` in your conversations

    Ask your agent: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.`

    A successful tool call returns documentation results.

  </Step>
</Steps>

</Tab>

<Tab value="Cline">

[Cline](https://github.com/cline/cline) is a VS Code extension that uses MCP servers.

<Steps>
  <Step>
    ### Open Cline MCP Settings [#open-cline-mcp-settings]
    1. Open the Cline extension panel in VS Code
    2. Click the menu (⋮) in the top right corner of the Cline panel
    3. Select "MCP Servers" from the dropdown menu
    
    This will open the MCP Servers interface where you can manage your server connections.
  </Step>
  <Step>
    ### Add MCP Server to Cline [#add-mcp-server-to-cline]
    In the MCP Servers interface, use one of these two options:

    <Tabs groupId="cline-setup" items={['Remote Server Setup', 'Configuration File Setup']} default="Remote Server Setup">
      <Tab value="Remote Server Setup">
        1. Click on the "Remote Servers" tab
        2. Enter a Server Name (e.g., "CopilotKit MCP")
        3. Enter the Server URL:
        ```
        https://mcp.copilotkit.ai/sse
        ```
        4. Click "Add Server" to connect
      </Tab>
      <Tab value="Configuration File Setup">
        Alternatively, you can configure via the advanced settings:
        1. In the "Installed" tab, click "Configure MCP Servers"
        2. Add the following configuration to your settings file:
        ```json
        {
          "mcpServers": {
            "CopilotKit MCP": {
              "url": "https://mcp.copilotkit.ai/sse",
              "disabled": false,
              "timeout": 30
            }
          }
        }
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step>
    ### Using MCP Tools in Cline [#using-mcp-tools-in-cline]
    Once connected, Cline can automatically use the tools provided by CopilotKit MCP when you interact with the AI assistant. The MCP tools will be available without requiring manual selection.

    Ask your agent: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.`

    A successful tool call returns documentation results.

  </Step>
</Steps>

</Tab>

<Tab value="GitHub Copilot">

[GitHub Copilot](https://github.com/features/copilot) uses MCP servers in VS Code agent mode.

<Steps>
  <Step>
    ### Enable MCP Support in VS Code [#enable-mcp-support-in-vs-code]
    1. Open VS Code Settings (`Cmd+,` on Mac or `Ctrl+,` on Windows/Linux)
    2. Search for "MCP" in the settings search bar
    3. Enable the `chat.mcp.enabled` setting
  </Step>
  <Step>
    ### Add MCP Server to GitHub Copilot [#add-mcp-server-to-github-copilot]
    You can configure MCP servers for GitHub Copilot in several ways:

    <Tabs groupId="copilot-config" items={['Workspace Configuration (Recommended)', 'User Settings Configuration', 'Command Palette']} default="Workspace Configuration (Recommended)">
      <Tab value="Workspace Configuration (Recommended)">
        Create a `.vscode/mcp.json` file in your project root:
        ```json
        {
          "servers": {
            "CopilotKit MCP": {
              "url": "https://mcp.copilotkit.ai/sse"
            }
          }
        }
        ```
      </Tab>
      <Tab value="User Settings Configuration">
        Add to your VS Code `settings.json`:
        ```json
        {
          "mcp": {
            "servers": {
              "CopilotKit MCP": {
                "url": "https://mcp.copilotkit.ai/sse"
              }
            }
          }
        }
        ```
      </Tab>
      <Tab value="Command Palette">
        1. Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
        2. Type "MCP: Add Server" and select the command
        3. Choose "HTTP (sse)" as the server type
        4. Enter the server URL: `https://mcp.copilotkit.ai/sse`
        5. Provide a name for the server: `CopilotKit MCP`
      </Tab>
    </Tabs>

  </Step>
  <Step>
    ### Using MCP Tools with GitHub Copilot [#using-mcp-tools-with-github-copilot]
    1. Open Copilot Chat in VS Code (click the Copilot icon in the activity bar)
    2. Switch to Agent mode from the chat dropdown menu
    3. Click the Tools (🔧) button to view available MCP tools
    4. Your CopilotKit MCP tools will be listed and can be used automatically

    You can also reference tools directly using `#` followed by the tool name.

    Ask your agent: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.`

    A successful tool call returns documentation results.

  </Step>
</Steps>

</Tab>

<Tab value="Codex">

[Codex](https://developers.openai.com/codex/mcp) supports Streamable HTTP MCP servers directly.

<Steps>
  <Step>
    ### Add MCP Server to Codex [#add-mcp-server-to-codex]
    Run this command:

    ```bash
    codex mcp add copilotkit --url https://mcp.copilotkit.ai/mcp
    ```

    Alternatively, add this table to `~/.codex/config.toml`:

    ```toml title="~/.codex/config.toml"
    [mcp_servers.copilotkit]
    url = "https://mcp.copilotkit.ai/mcp"
    ```

    If you used the previous `mcp-remote` configuration, replace its `command` and `args` entries with `url`.
    Use `/mcp` for Streamable HTTP. The root URL (`https://mcp.copilotkit.ai`) returns 404.
  </Step>
  <Step>
    ### Verify Connection [#verify-connection-1]
    List the configured MCP servers:

    ```bash
    codex mcp list
    ```

    This command verifies registration only. Start a new Codex session and run `/mcp` to check the connection and available tools.

    Ask Codex to test a documentation search: `Use CopilotKit's search-docs tool to find documentation for useFrontendTool.`

    A successful tool call returns documentation results. If the server fails to connect, verify that its URL ends with `/mcp`.
  </Step>
</Steps>

</Tab>

<Tab value="Other">

For MCP-compatible applications not listed above, use these universal integration patterns. MCP (Model Context Protocol) is an open standard that allows AI applications to connect with external tools and data sources.

#### Connection Methods [#connection-methods]

Most MCP-compatible applications support one or both of these connection methods:

<Tabs groupId="universal-transport" items={['SSE', 'stdio']} default="SSE">
  <Tab value="SSE">
    For web-based or remote integrations:
    ```
    https://mcp.copilotkit.ai/sse
    ```
  </Tab>
  <Tab value="stdio">
    For local command-line integrations:
    ```json
    {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.copilotkit.ai/mcp"]
    }
    ```
  </Tab>
</Tabs>

#### Integration Steps [#integration-steps]

1. **Find MCP Settings** - Look for "MCP," "Model Context Protocol," or "Tools" in your application settings
2. **Add Server** - Use the SSE URL: `https://mcp.copilotkit.ai/sse`
3. **Test Connection** - Restart your application and verify the server appears in available tools

#### Common Configuration Patterns [#common-configuration-patterns]

<Tabs groupId="config-patterns" items={['JSON Configuration File', 'Application Settings']} default="JSON Configuration File">
  <Tab value="JSON Configuration File">
    Many applications use a configuration file (locations vary by app):
    ```json
    {
      "servers": {
        "CopilotKit MCP": {
          "url": "https://mcp.copilotkit.ai/sse"
        }
      }
    }
    ```
  </Tab>
  <Tab value="Application Settings">
    Some apps integrate MCP into their main settings:
    ```json
    {
      "mcp": {
        "enabled": true,
        "servers": {
          "CopilotKit MCP": {
            "url": "https://mcp.copilotkit.ai/sse"
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

</Tab>

</Tabs>
