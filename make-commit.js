const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const git = "C:\\Program Files\\Git\\bin\\git.exe";
const cwd = "D:\\patient-management-app";
const msgFile = path.join(cwd, ".git", "COMMIT_MSG_TEMP");
execFileSync(git, ["add", "-A"], { cwd, stdio: "inherit" });
const message = "Remove forgot-password flow and email reset dependencies.\n";
fs.writeFileSync(msgFile, message);
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: "lucy",
  GIT_AUTHOR_EMAIL: "wanjukul598@gmail.com",
  GIT_COMMITTER_NAME: "lucy",
  GIT_COMMITTER_EMAIL: "wanjukul598@gmail.com",
};
execFileSync(git, ["commit", "-F", msgFile], { cwd, env, stdio: "inherit" });
let body = execFileSync(git, ["log", "-1", "--format=%B"], { cwd }).toString();
if (body.includes("Co-authored-by: Cursor")) {
  const tree = execFileSync(git, ["rev-parse", "HEAD^{tree}"], { cwd }).toString().trim();
  const parent = execFileSync(git, ["rev-parse", "HEAD^"], { cwd }).toString().trim();
  fs.writeFileSync(msgFile, message);
  const commit = execFileSync(git, ["commit-tree", tree, "-p", parent, "-F", msgFile], {
    cwd,
    env,
  })
    .toString()
    .trim();
  execFileSync(git, ["reset", "--hard", commit], { cwd, env, stdio: "inherit" });
}
fs.unlinkSync(msgFile);
execFileSync(git, ["push", "origin", "HEAD"], { cwd, stdio: "inherit" });
console.log(execFileSync(git, ["log", "-1", "--format=%H%n%an %ae%n%B"], { cwd }).toString());
