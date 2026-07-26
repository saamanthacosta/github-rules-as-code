import { ghApi } from './client.mjs';
import { logger } from '../utils/logger.mjs';

export async function repoExists(repo) {
  try {
    await ghApi('GET', `/repos/${repo}`);
    return true;
  } catch (err) {
    if (String(err).includes('404')) return false;
    throw err;
  }
}

export async function assertRepoExists(repo) {
  if (!(await repoExists(repo))) {
    const error = new Error(`repository ${repo} not found`);
    error.code = 'REPO_NOT_FOUND';
    throw error;
  }
}

export async function listRulesets(repo) {
  return ghApi('GET', `/repos/${repo}/rulesets`);
}

export async function getRuleset(repo, id) {
  return ghApi('GET', `/repos/${repo}/rulesets/${id}`);
}

export async function deleteRuleset(repo, id) {
  return ghApi('DELETE', `/repos/${repo}/rulesets/${id}`);
}

export async function createRuleset(repo, payload) {
  return ghApi('POST', `/repos/${repo}/rulesets`, { body: payload });
}

export async function updateRuleset(repo, id, payload) {
  return ghApi('PUT', `/repos/${repo}/rulesets/${id}`, { body: payload });
}

export { logger };
