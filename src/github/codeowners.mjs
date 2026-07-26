import { ghApi } from './client.mjs';
import { logger } from '../utils/logger.mjs';

function contentsPath(repo, ref) {
  return `/repos/${repo}/contents/.github/CODEOWNERS?ref=${ref}`;
}

async function getFileBlob(repo, ref) {
  try {
    const res = await ghApi('GET', contentsPath(repo, ref));
    return { sha: res.sha, blob: null };
  } catch (err) {
    if (String(err).includes('404')) return null;
    throw err;
  }
}

async function getDefaultBranch(repo) {
  const meta = await ghApi('GET', `/repos/${repo}`);
  return meta.default_branch;
}

async function getRefSha(repo, ref) {
  const res = await ghApi('GET', `/repos/${repo}/git/ref/heads/${ref}`);
  return res.object.sha;
}

async function getCommit(repo, sha) {
  return ghApi('GET', `/repos/${repo}/git/commits/${sha}`);
}

async function createBlob(repo, content) {
  return ghApi('POST', `/repos/${repo}/git/blobs`, {
    body: { content, encoding: 'utf-8' },
  });
}

async function createTree(repo, baseTreeSha, path, blobSha) {
  return ghApi('POST', `/repos/${repo}/git/trees`, {
    body: {
      base_tree: baseTreeSha,
      tree: [{ path, mode: '100644', type: 'blob', sha: blobSha }],
    },
  });
}

async function createCommit(repo, message, treeSha, parentSha) {
  return ghApi('POST', `/repos/${repo}/git/commits`, {
    body: { message, tree: treeSha, parents: [parentSha] },
  });
}

async function createRef(repo, branch, sha) {
  return ghApi('POST', `/repos/${repo}/git/refs`, {
    body: { ref: `refs/heads/${branch}`, sha },
  });
}

async function openPullRequest(repo, head, base, title, body) {
  return ghApi('POST', `/repos/${repo}/pulls`, {
    body: { title, head, base, body, maintainer_can_modify: true },
  });
}

export function renderCodeowners(owners) {
  return `* ${owners.join(' ')}\n`;
}

export async function getCodeowners(repo) {
  try {
    const res = await ghApi('GET', contentsPath(repo, 'HEAD'));
    return Buffer.from(res.content, 'base64').toString('utf8');
  } catch (err) {
    if (String(err).includes('404')) return null;
    throw err;
  }
}

export async function putCodeowners(repo, content) {
  const message = 'chore: update CODEOWNERS via github-rules-as-code';
  try {
    const sha = await getFileSha(repo, 'HEAD');
    await putContents(repo, undefined, content, message, sha);
    logger.info({ repo }, 'CODEOWNERS written directly');
    return;
  } catch (err) {
    if (!String(err).includes('409') && !String(err).includes('pull request')) {
      throw err;
    }
    logger.info({ repo }, 'Direct write blocked; opening a PR via Git Data API');
  }
  await putCodeownersViaPr(repo, content, message);
}

async function getFileSha(repo, ref) {
  try {
    const res = await ghApi('GET', contentsPath(repo, ref));
    return res.sha;
  } catch (err) {
    if (String(err).includes('404')) return undefined;
    throw err;
  }
}

async function putContents(repo, branch, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
  if (branch) body.branch = branch;
  if (sha) body.sha = sha;
  return ghApi('PUT', `/repos/${repo}/contents/.github/CODEOWNERS`, { body });
}

async function putCodeownersViaPr(repo, content, message) {
  const base = await getDefaultBranch(repo);
  const head = `chore/codeowners-${Date.now()}`;
  const baseSha = await getRefSha(repo, base);
  const baseCommit = await getCommit(repo, baseSha);
  const blob = await createBlob(repo, content);
  const tree = await createTree(repo, baseCommit.tree.sha, '.github/CODEOWNERS', blob.sha);
  const commit = await createCommit(repo, message, tree.sha, baseSha);
  await createRef(repo, head, commit.sha);
  const title = 'chore: update CODEOWNERS';
  const body =
    'Automated by [github-rules-as-code](https://github.com/saamanthacosta/github-rules-as-code). ' +
    'Please review the owner list and merge.';
  const pr = await openPullRequest(repo, head, base, title, body);
  logger.info({ repo, pr: pr.html_url, number: pr.number }, 'CODEOWNERS PR opened');
}
