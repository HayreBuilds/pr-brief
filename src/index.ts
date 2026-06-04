import { getPullRequest, getPullRequestFiles, getPRComments, createComment, updateComment, buildDiffSummary, PR_BRIEF_MARKER } from "./github.js";
import { summarizePR, wrapComment } from "./summarizer.js";

function getInput(name: string, fallback = ""): string {
  return process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`] ?? fallback;
}
function setOutput(name: string, value: string) {
  const fs = require("fs");
  const outFile = process.env["GITHUB_OUTPUT"];
  if (outFile) fs.appendFileSync(outFile, `${name}=${value}\n`);
  else process.stdout.write(`::set-output name=${name}::${value}\n`);
}
function log(msg: string) { process.stdout.write(`[pr-brief] ${msg}\n`); }
function fail(msg: string) { process.stderr.write(`::error::${msg}\n`); process.exit(1); }

async function run() {
  const apiKey = getInput("nvidia-api-key");
  const model = getInput("model", "nvidia/nemotron-3-ultra-550b-a55b");
  const maxDiffLines = parseInt(getInput("max-diff-lines", "400"), 10);
  const postComment = getInput("post-comment", "true") === "true";
  const updateExisting = getInput("update-existing", "true") === "true";
  const ghToken = getInput("github-token");

  if (!apiKey) fail("nvidia-api-key input is required");

  const eventPath = process.env["GITHUB_EVENT_PATH"];
  const eventName = process.env["GITHUB_EVENT_NAME"];

  if (eventName !== "pull_request" && eventName !== "pull_request_target") {
    fail(`This action only works on pull_request events. Got: ${eventName}`);
    return;
  }

  const eventData: { pull_request?: { number?: number }; repository?: { full_name?: string } } =
    eventPath ? JSON.parse(require("fs").readFileSync(eventPath, "utf-8")) : {};

  const prNumber = eventData.pull_request?.number;
  const repoFullName = eventData.repository?.full_name ?? process.env["GITHUB_REPOSITORY"] ?? "";
  const [owner, repo] = repoFullName.split("/");

  if (!prNumber || !owner || !repo) fail("Could not determine PR number or repository");

  log(`Summarizing PR #${prNumber} in ${owner}/${repo}`);

  const [pr, files] = await Promise.all([
    getPullRequest(owner!, repo!, prNumber!, ghToken),
    getPullRequestFiles(owner!, repo!, prNumber!, ghToken),
  ]);

  if (pr.draft) {
    log("PR is a draft — skipping summary");
    process.exit(0);
  }

  const diff = buildDiffSummary(files, maxDiffLines);
  log(`Processing ${files.length} files, ~${diff.split("\n").length} diff lines`);

  const summary = await summarizePR(pr, files, diff, apiKey, model);
  log("Summary generated successfully");

  setOutput("summary", summary.replace(/\n/g, "%0A"));

  if (postComment) {
    const comment = wrapComment(summary, prNumber!, model);

    if (updateExisting) {
      const existing = await getPRComments(owner!, repo!, prNumber!, ghToken);
      const briefComment = existing.find(c => c.body.includes(PR_BRIEF_MARKER));
      if (briefComment) {
        await updateComment(owner!, repo!, briefComment.id, comment, ghToken);
        log(`Updated existing comment #${briefComment.id}`);
        return;
      }
    }

    const commentId = await createComment(owner!, repo!, prNumber!, comment, ghToken);
    log(`Posted new comment #${commentId}`);
  }
}

run().catch(e => fail((e as Error).message));
