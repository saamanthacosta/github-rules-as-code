import { ghApi } from './client.mjs';

function path(repo, ref = 'heads/main') {
  return `/repos/${repo}/contents/.github/CODEOWNERS?ref=${ref}`;
}

export async function getCodeowners(repo) {
  try {
    const res = await ghApi('GET', path(repo));
    return Buffer.from(res.content, 'base64').toString('utf8');
  } catch (err) {
    if (String(err).includes('404')) return null;
    throw err;
  }
}

export async function putCodeowners(repo, content, message) {
  let sha;
  try {
    const existing = await ghApi('GET', path(repo));
    sha = existing.sha;
  } catch (err) {
    if (!String(err).includes('404')) throw err;
  }
  const body = {
    message: message ?? 'chore: update CODEOWNERS via github-rules-as-code',
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
  if (sha) body.sha = sha;
  return ghApi('PUT', `/repos/${repo}/contents/.github/CODEOWNERS`, { body });
}

export function renderCodeowners(owners) {
  return `* ${owners.join(' ')}\n`;
}
