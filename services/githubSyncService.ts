import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface GitHubSyncTarget {
  repo: string;
  token: string;
}

export interface SyncFileInput {
  path: string; // Repository relative path e.g. "leetcode/LeetCode_Daily_Report_2026-10-19.csv"
  content?: string | Buffer;
  localFilePath?: string;
}

/**
 * Returns all configured GitHub repository sync targets.
 * Ensures both TK4743/taskmanager and Tharun4743/taskmanager stay in 100% parity.
 */
export function getGitHubSyncTargets(): GitHubSyncTarget[] {
  const targets: GitHubSyncTarget[] = [];
  const seenRepos = new Set<string>();

  // 1. Explicit tokens configured via GitHub Workflow secrets or environment
  const tkToken = process.env.GITHUB_TOKEN_TK4743;
  if (tkToken) {
    targets.push({ repo: 'TK4743/taskmanager', token: tkToken });
    seenRepos.add('TK4743/taskmanager');
  }

  const tharunToken = process.env.GITHUB_TOKEN_THARUN;
  if (tharunToken) {
    targets.push({ repo: 'Tharun4743/taskmanager', token: tharunToken });
    seenRepos.add('Tharun4743/taskmanager');
  }

  // 2. Standard GITHUB_TOKEN (e.g. from GitHub Actions secrets.GITHUB_TOKEN or env)
  const defaultToken = process.env.GITHUB_TOKEN;
  if (defaultToken) {
    const targetRepo = process.env.GITHUB_REPOSITORY || process.env.GITHUB_REPO || 'Tharun4743/taskmanager';
    if (!seenRepos.has(targetRepo)) {
      targets.push({ repo: targetRepo, token: defaultToken });
      seenRepos.add(targetRepo);
    }
  }

  return targets;
}

/**
 * Safely writes a file to disk:
 * First attempts process.cwd() (for local and persistent servers).
 * If process.cwd() is read-only (like Vercel serverless /var/task), falls back to os.tmpdir().
 */
export function safeWriteExportFile(relPath: string, content: string | Buffer): { absPath: string; isTemp: boolean } {
  const cleanRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const primaryPath = path.join(process.cwd(), cleanRel);
  
  try {
    const dir = path.dirname(primaryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(primaryPath, content);
    return { absPath: primaryPath, isTemp: false };
  } catch (err: any) {
    // Read-only filesystem (e.g. Vercel / AWS Lambda) -> write to tmpdir
    const tmpPath = path.join(os.tmpdir(), cleanRel);
    const tmpDir = path.dirname(tmpPath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(tmpPath, content);
    return { absPath: tmpPath, isTemp: true };
  }
}

/**
 * Uploads/commits multiple files atomically to all GitHub sync target repositories.
 * Uses GitHub Git Database API (Blobs -> Tree -> Commit -> Ref Update)
 * to avoid 409 commit collisions and reduce multiple file commits to a single clean commit.
 */
export async function commitFilesToGitHub(
  files: SyncFileInput[],
  commitMsg: string
): Promise<Record<string, boolean>> {
  const targets = getGitHubSyncTargets();
  const results: Record<string, boolean> = {};

  if (targets.length === 0 || files.length === 0) {
    return results;
  }

  // Resolve content for each file
  const preparedFiles: Array<{ path: string; base64: string }> = [];
  for (const f of files) {
    const cleanPath = f.path.replace(/\\/g, '/').replace(/^\/+/, '');
    let base64 = '';

    if (f.content !== undefined) {
      base64 = Buffer.isBuffer(f.content)
        ? f.content.toString('base64')
        : Buffer.from(f.content, 'utf-8').toString('base64');
    } else if (f.localFilePath && fs.existsSync(f.localFilePath)) {
      base64 = fs.readFileSync(f.localFilePath).toString('base64');
    }

    if (base64) {
      preparedFiles.push({ path: cleanPath, base64 });
    }
  }

  if (preparedFiles.length === 0) {
    return results;
  }

  for (const target of targets) {
    try {
      const headers = {
        Authorization: `Bearer ${target.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'IT-TaskManager-Sync',
        'Content-Type': 'application/json'
      };

      // 1. Get HEAD commit sha of main branch
      const refRes = await fetch(`https://api.github.com/repos/${target.repo}/git/ref/heads/main`, {
        headers,
        signal: AbortSignal.timeout(20000)
      });
      if (!refRes.ok) {
        console.warn(`[GitHub DualSync] Failed to fetch HEAD for ${target.repo} (${refRes.status}):`, await refRes.text());
        results[target.repo] = false;
        continue;
      }
      const refData = (await refRes.json()) as { object: { sha: string } };
      const commitSha = refData.object.sha;

      // 2. Get base tree sha
      const commitRes = await fetch(`https://api.github.com/repos/${target.repo}/git/commits/${commitSha}`, {
        headers,
        signal: AbortSignal.timeout(20000)
      });
      if (!commitRes.ok) {
        console.warn(`[GitHub DualSync] Failed to fetch commit tree for ${target.repo}:`, await commitRes.text());
        results[target.repo] = false;
        continue;
      }
      const commitData = (await commitRes.json()) as { tree: { sha: string } };
      const baseTreeSha = commitData.tree.sha;

      // 3. Create Blobs for each file
      const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];
      for (const item of preparedFiles) {
        const blobRes = await fetch(`https://api.github.com/repos/${target.repo}/git/blobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: item.base64,
            encoding: 'base64'
          }),
          signal: AbortSignal.timeout(120000)
        });

        if (!blobRes.ok) {
          throw new Error(`Blob creation failed for ${item.path} on ${target.repo}: ${await blobRes.text()}`);
        }

        const blobData = (await blobRes.json()) as { sha: string };
        treeEntries.push({
          path: item.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        });
      }

      // 4. Create new Git Tree
      const treeRes = await fetch(`https://api.github.com/repos/${target.repo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeEntries
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (!treeRes.ok) {
        throw new Error(`Tree creation failed on ${target.repo}: ${await treeRes.text()}`);
      }
      const treeData = (await treeRes.json()) as { sha: string };
      const newTreeSha = treeData.sha;

      // 5. Create new Commit
      const newCommitRes = await fetch(`https://api.github.com/repos/${target.repo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: commitMsg,
          tree: newTreeSha,
          parents: [commitSha]
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (!newCommitRes.ok) {
        throw new Error(`Commit creation failed on ${target.repo}: ${await newCommitRes.text()}`);
      }
      const newCommitData = (await newCommitRes.json()) as { sha: string };
      const newCommitSha = newCommitData.sha;

      // 6. Update reference refs/heads/main
      const patchRes = await fetch(`https://api.github.com/repos/${target.repo}/git/refs/heads/main`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitSha,
          force: false
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (!patchRes.ok) {
        throw new Error(`Ref update failed on ${target.repo}: ${await patchRes.text()}`);
      }

      console.log(`[GitHub DualSync] 🚀 Auto-pushed ${preparedFiles.length} file(s) to ${target.repo} via Git Tree API (${newCommitSha.slice(0, 7)}).`);
      results[target.repo] = true;
    } catch (err: any) {
      console.warn(`[GitHub DualSync] Error updating ${target.repo} via Git Tree API:`, err.message);
      // Fallback: try individual file upload via Contents API
      let targetSuccess = true;
      for (const item of preparedFiles) {
        const ok = await updateSingleFileViaContentsAPI(target, item.path, item.base64, commitMsg);
        if (!ok) targetSuccess = false;
      }
      results[target.repo] = targetSuccess;
    }
  }

  return results;
}

/**
 * Fallback / single-file update via GitHub Contents REST API
 */
async function updateSingleFileViaContentsAPI(
  target: GitHubSyncTarget,
  cleanPath: string,
  base64Content: string,
  commitMsg: string
): Promise<boolean> {
  const url = `https://api.github.com/repos/${target.repo}/contents/${cleanPath}`;
  const headers = {
    Authorization: `Bearer ${target.token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'IT-TaskManager-Sync',
    'Content-Type': 'application/json'
  };

  try {
    let sha: string | undefined;
    const getRes = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (getRes.ok) {
      const json = (await getRes.json()) as { sha: string };
      sha = json.sha;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: commitMsg,
        content: base64Content,
        sha,
        branch: 'main'
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (putRes.ok) {
      console.log(`[GitHub Sync] 🚀 Updated ${cleanPath} on ${target.repo} via Contents API.`);
      return true;
    } else {
      const errText = await putRes.text();
      console.warn(`[GitHub Sync] Contents API error on ${target.repo} (${putRes.status}):`, errText);
      return false;
    }
  } catch (e: any) {
    console.warn(`[GitHub Sync] Error on ${target.repo}:`, e.message);
    return false;
  }
}

/**
 * Updates a single file across all configured GitHub repositories.
 * Backward compatible signature with existing updateGitHubFileViaAPI.
 */
export async function updateGitHubFileViaAPI(
  filePathOrRelative: string,
  commitMsg: string,
  explicitContent?: string | Buffer
): Promise<boolean> {
  let content: string | Buffer | undefined = explicitContent;
  let relPath = filePathOrRelative;

  if (content === undefined) {
    if (fs.existsSync(filePathOrRelative)) {
      content = fs.readFileSync(filePathOrRelative);
      relPath = path.relative(process.cwd(), filePathOrRelative).replace(/\\/g, '/');
    } else {
      const tmpPath = path.join(os.tmpdir(), filePathOrRelative);
      if (fs.existsSync(tmpPath)) {
        content = fs.readFileSync(tmpPath);
        relPath = filePathOrRelative.replace(/\\/g, '/');
      } else {
        console.warn(`[GitHub Sync] File does not exist: ${filePathOrRelative}`);
        return false;
      }
    }
  }

  const results = await commitFilesToGitHub([{ path: relPath, content }], commitMsg);
  return Object.values(results).some(Boolean);
}

/**
 * Deletes a file across all configured GitHub repositories via Contents API.
 */
export async function deleteGitHubFileViaAPI(
  relativePath: string,
  commitMsg: string
): Promise<boolean> {
  const targets = getGitHubSyncTargets();
  const cleanPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  let anySuccess = false;

  for (const target of targets) {
    const url = `https://api.github.com/repos/${target.repo}/contents/${cleanPath}`;
    const headers = {
      Authorization: `Bearer ${target.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'IT-TaskManager-Sync',
      'Content-Type': 'application/json'
    };

    try {
      const getRes = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      if (!getRes.ok) continue;

      const json = (await getRes.json()) as { sha: string };
      const delRes = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          message: commitMsg,
          sha: json.sha,
          branch: 'main'
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (delRes.ok) {
        console.log(`[GitHub Sync] 🗑️ Deleted ${cleanPath} on ${target.repo}`);
        anySuccess = true;
      }
    } catch (e: any) {
      console.warn(`[GitHub Sync] Failed to delete ${cleanPath} on ${target.repo}:`, e.message);
    }
  }

  return anySuccess;
}

/**
 * Executes local git push if running on a persistent environment with Git CLI.
 */
export async function tryLocalGitPush(folderPath: string, commitMsg: string): Promise<boolean> {
  try {
    await execPromise(`git add ${folderPath}`);
    const statusRes = await execPromise(`git status --porcelain ${folderPath}`);
    if (statusRes.stdout.trim()) {
      await execPromise(`git commit -m "${commitMsg}"`);
      await execPromise('git push origin main');
      console.log(`[Local Git] 🚀 Auto-pushed ${folderPath} to GitHub via Git CLI: ${commitMsg}`);
      return true;
    }
    return false;
  } catch (err: any) {
    // Non-blocking in cloud/serverless environments where Git CLI is not configured
    return false;
  }
}
