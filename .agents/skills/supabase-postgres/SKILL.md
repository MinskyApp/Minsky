---
name: supabase-postgres-best-practices
description: Audit SQL queries and schema design against Supabase Postgres Best Practices. Use when asked to "optimize my database", "check my SQL", "review RLS policies", or "improve postgres performance".
metadata:
  author: supabase
  version: "1.0.0"
  argument-hint: <sql-files-or-schema-pattern>
---

# Supabase Postgres Best Practices

Review database files, schemas, and queries for performance, security, and scalability compliance.

## How It Works

1. Analyze the provided SQL files or schema definitions.
2. Evaluate compliance across 8 prioritized categories (from Query Performance to Advanced Features).
3. Identify bottlenecks in connection management, locking, and RLS (Row-Level Security).
4. Output specific recommendations with the priority prefix (e.g., `query-`, `security-`).

## Rule Categories & Priority

| Priority | Category | Impact | Prefix |
| :--- | :--- | :--- | :--- |
| 1 | Query Performance | CRITICAL | query- |
| 2 | Connection Management | CRITICAL | conn- |
| 3 | Security & RLS | CRITICAL | security- |
| 4 | Schema Design | HIGH | schema- |
| 5 | Concurrency & Locking | MEDIUM-HIGH | lock- |
| 6 | Data Access Patterns | MEDIUM | data- |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | monitor- |
| 8 | Advanced Features | LOW | advanced- |

## Reference Implementation

When reviewing, focus on these key rule-sets:
- **Indexes:** Check for missing or partial indexes (`query-missing-indexes.md`).
- **Security:** Validate Row-Level Security (RLS) implementation.
- **Efficiency:** Optimize data access patterns and connection pooling.

## Usage

When a user provides a file or database schema:
1. Parse the SQL for anti-patterns based on the categories above.
2. Provide feedback in a terse `file:line:prefix` format followed by the optimization suggestion.
3. If no files are specified, prompt the user for the schema or query they wish to optimize.