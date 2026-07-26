import { z } from 'zod';

export const rulesetRuleSchema = z.object({
  type: z.enum([
    'creation',
    'deletion',
    'non_fast_forward',
    'pull_request',
    'required_linear_history',
    'required_signatures',
    'update',
  ]),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const branchPatternSchema = z.object({
  name: z.string().min(1),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  protect: z.boolean().optional(),
  required_deployments: z.array(z.string()).optional(),
  required_status_checks: z.array(z.string()).optional(),
});

export const tagPatternSchema = z.object({
  pattern: z.string().min(1),
});

export const defaultRulesetSchema = z.object({
  name: z.string().min(1),
  target: z.enum(['branch', 'tag']).default('branch'),
  enforcement: z.enum(['active', 'evaluate', 'disabled']).default('active'),
  conditions: z
    .object({
      ref_name: z
        .object({
          include: z.array(z.string()).min(1),
          exclude: z.array(z.string()),
        })
        .optional(),
    })
    .optional(),
  rules: z.array(rulesetRuleSchema).min(1),
  branch_patterns: z.array(branchPatternSchema).optional(),
  tag_patterns: z.array(tagPatternSchema).optional(),
  bypass_actors: z
    .array(
      z.object({
        actor_id: z.number().int(),
        actor_type: z.enum(['Team', 'User', 'Role']),
        bypass_mode: z.enum(['always', 'pull_request']).default('always'),
      }),
    )
    .optional(),
});

export const manifestSchema = z.object({
  repo: z.string().regex(/^[^/]+\/[^/]+$/, 'expected owner/name'),
  default: z.string().min(1),
  codeowners: z.array(z.string().regex(/^@.+/)).min(1),
  overrides: defaultRulesetSchema.partial().optional(),
});
