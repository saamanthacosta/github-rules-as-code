import { ghApi } from './client.mjs';

function path(repo) {
  return `/repos/${repo}/rulesets`;
}

export async function listRulesets(repo) {
  return ghApi('GET', path(repo));
}

export async function getRuleset(repo, id) {
  return ghApi('GET', `${path(repo)}/${id}`);
}

export async function deleteRuleset(repo, id) {
  return ghApi('DELETE', `${path(repo)}/${id}`);
}

export async function createRuleset(repo, payload) {
  return ghApi('POST', path(repo), { body: payload });
}

export async function updateRuleset(repo, id, payload) {
  return ghApi('PUT', `${path(repo)}/${id}`, { body: payload });
}
