/**
 * ComplianceOS — Policy Generator API
 * Sprint 2 Tasks 2.1, 2.2, 2.5, 2.10
 *
 * GET  /api/v1/policies                    — List policy templates
 * POST /api/v1/policies/generate           — Generate a policy from template + variables
 * GET  /api/v1/policies/preview/{type}     — Preview rendered policy
 */

import { NextResponse, NextRequest } from "next/server";
import { POLICY_TEMPLATES, PolicyTemplateSeed } from "@complianceos/db/policy-templates";

// Simple Handlebars-like template renderer
function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(regex, value || `[${key}]`);
  }
  // Replace any remaining unreplaced variables with placeholder
  rendered = rendered.replace(/\{\{(\w+)\}\}/g, "[$1]");
  return rendered;
}

// GET — List all available templates
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const type = req.nextUrl.searchParams.get("type");

  let templates = POLICY_TEMPLATES;

  if (lang) {
    templates = templates.filter((t) => t.language === lang);
  }
  if (type) {
    templates = templates.filter((t) => t.type === type);
  }

  return NextResponse.json({
    templates: templates.map((t) => ({
      type: t.type,
      name: t.name,
      description: t.description,
      version: t.version,
      language: t.language,
      ruleRefs: t.ruleRefs,
      industries: t.industries,
      isDefault: t.isDefault,
      variableSchema: t.variableSchema,
    })),
    total: templates.length,
  });
}

// POST — Generate a policy from template + variables
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, language, variables, format } = body as {
      type: string;
      language?: string;
      variables: Record<string, string>;
      format?: "markdown" | "html";
    };

    if (!type || !variables) {
      return NextResponse.json(
        { error: "Missing required fields: type, variables" },
        { status: 400 }
      );
    }

    // Find matching template
    const lang = language || "en";
    const template = POLICY_TEMPLATES.find(
      (t) => t.type === type && t.language === lang
    );

    if (!template) {
      return NextResponse.json(
        {
          error: `No template found for type="${type}" and language="${lang}"`,
          availableTypes: [...new Set(POLICY_TEMPLATES.map((t) => t.type))],
          availableLanguages: [...new Set(POLICY_TEMPLATES.map((t) => t.language))],
        },
        { status: 404 }
      );
    }

    // Validate required variables
    const missingVars: string[] = [];
    for (const [key, schema] of Object.entries(template.variableSchema)) {
      if (schema.required && !variables[key]) {
        missingVars.push(key);
      }
    }

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required template variables",
          missingVariables: missingVars,
          variableSchema: template.variableSchema,
        },
        { status: 422 }
      );
    }

    // Render the template
    const renderedMarkdown = renderTemplate(template.templateBody, variables);

    // Convert to HTML if requested
    let renderedHtml: string | null = null;
    if (format === "html") {
      renderedHtml = markdownToHtml(renderedMarkdown, variables.companyName || "ComplianceOS");
    }

    return NextResponse.json({
      success: true,
      policy: {
        type: template.type,
        name: template.name,
        language: template.language,
        version: template.version,
        ruleRefs: template.ruleRefs,
        generatedAt: new Date().toISOString(),
        content: {
          markdown: renderedMarkdown,
          html: renderedHtml,
        },
        variables,
        meta: {
          templateVersion: template.version,
          generatorVersion: "1.0.0",
          framework: "DPDP Act 2023 + Rules 2025",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate policy", details: String(error) },
      { status: 500 }
    );
  }
}

// Minimal markdown to HTML converter
function markdownToHtml(md: string, title: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, "<hr/>")
    // Unordered list items
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Simple table support
    .replace(/\| (.+) \|/g, (match) => {
      const cells = match
        .split("|")
        .filter((c) => c.trim())
        .map((c) => `<td>${c.trim()}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    // Line breaks
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Privacy Notice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; }
    h1 { font-size: 28px; margin: 24px 0 16px; color: #0f172a; }
    h2 { font-size: 20px; margin: 32px 0 12px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 16px; margin: 20px 0 8px; color: #334155; }
    p { margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 600; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    li { margin-left: 24px; margin-bottom: 4px; }
    a { color: #1e40af; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <p>${html}</p>
  <div class="footer">Generated by ComplianceOS · DPDP Act 2023 Compliant</div>
</body>
</html>`;
}
