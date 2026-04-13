// ─── GitHub Storage ────────────────────────────────────────────────────────
// Data is stored as public/data.json in the GitHub repo.
// - All visitors fetch it as a static file (fast, free, no auth)
// - Admin uses a Personal Access Token to commit updates via GitHub API
// ───────────────────────────────────────────────────────────────────────────

const CONFIG_KEY = 'npc-github-config';
const DATA_FILE = 'public/data.json';
export const PUBLIC_REPO = {
  owner: 'HWRBot',
  repo: 'tournament-site-ghpages',
  branch: 'main',
} as const;

export interface GitHubConfig {
  owner: string;   // GitHub username
  repo: string;    // Repository name
  branch: string;  // Usually "main"
  token: string;   // Personal Access Token (fine-grained: repo contents write)
}

// ── Config stored in localStorage (admin's browser only) ─────────────────

export function getGitHubConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGitHubConfig(cfg: GitHubConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearGitHubConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

export function isGitHubConfigured(): boolean {
  const cfg = getGitHubConfig();
  return !!(cfg?.owner && cfg?.repo && cfg?.token && cfg?.branch);
}

export async function validateAdminAccess(token: string): Promise<void> {
  const repoUrl = `https://api.github.com/repos/${PUBLIC_REPO.owner}/${PUBLIC_REPO.repo}`;
  const userUrl = 'https://api.github.com/user';
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  const [repoRes, userRes] = await Promise.all([
    fetch(repoUrl, { headers }),
    fetch(userUrl, { headers }),
  ]);

  if (!repoRes.ok) {
    throw new Error('Не удалось проверить доступ к репозиторию.');
  }
  if (!userRes.ok) {
    throw new Error('Невалидный GitHub token.');
  }

  const repoInfo = await repoRes.json();
  const userInfo = await userRes.json();
  const canPush = Boolean(repoInfo?.permissions?.push);
  const isOwner = repoInfo?.owner?.login?.toLowerCase?.() === userInfo?.login?.toLowerCase?.();

  if (!canPush && !isOwner) {
    throw new Error('У токена нет прав записи в репозиторий.');
  }
}

// ── Reading data (no auth, public URL) ───────────────────────────────────

export async function fetchDataFromGitHub(cfg: GitHubConfig): Promise<unknown> {
  // Use raw.githubusercontent.com — reflects commits within seconds, no caching
  const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${DATA_FILE}?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching data.json`);
  return res.json();
}

// ── Writing data (requires PAT) ───────────────────────────────────────────

export async function saveDataToGitHub(cfg: GitHubConfig, data: unknown): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${DATA_FILE}`;
  const headers = {
    Authorization: `token ${cfg.token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Get current SHA (required to update an existing file)
  let sha: string | undefined;
  const shaRes = await fetch(apiUrl, { headers });
  if (shaRes.ok) {
    const info = await shaRes.json();
    sha = info.sha;
  } else if (shaRes.status !== 404) {
    const err = await shaRes.json().catch(() => ({}));
    throw new Error(`GitHub API error getting SHA: ${err.message ?? shaRes.status}`);
  }

  // base64-encode the JSON content (GitHub API requires this)
  const json = JSON.stringify(data, null, 2);
  const content = btoa(unescape(encodeURIComponent(json)));

  const body: Record<string, unknown> = {
    message: `chore: update tournament data [skip ci]`,
    content,
    branch: cfg.branch,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(`GitHub save failed: ${err.message ?? putRes.status}`);
  }
}

// ── Upload arbitrary file (e.g. MP3) to the repo ─────────────────────────
// filePath: repo-relative path, e.g. "public/music/mvp.mp3"
// base64Content: raw base64 (no data URI prefix)
export async function saveFileToGitHub(
  cfg: GitHubConfig,
  filePath: string,
  base64Content: string,
  commitMessage = 'chore: upload file [skip ci]'
): Promise<string> {
  const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;
  const headers = {
    Authorization: `token ${cfg.token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Check if file already exists (need SHA to overwrite)
  let sha: string | undefined;
  const shaRes = await fetch(apiUrl, { headers });
  if (shaRes.ok) {
    const info = await shaRes.json();
    sha = info.sha;
  }

  const body: Record<string, unknown> = {
    message: commitMessage,
    content: base64Content,
    branch: cfg.branch,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(`GitHub file upload failed: ${err.message ?? putRes.status}`);
  }

  // Return the public raw URL for the uploaded file
  return `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${filePath}`;
}
