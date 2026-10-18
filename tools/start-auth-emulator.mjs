import { existsSync, mkdirSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localTools = path.join(projectRoot, ".tools");
const bundledJavaHome = path.join(localTools, "temurin-21-jre", "jdk-21.0.12.1+1-jre");
const bundledJava = path.join(bundledJavaHome, "bin", "java.exe");
const localProfile = path.join(localTools, "firebase-emulator-profile");
const npmCache = path.join(localTools, "npm-cache");
const localTemp = path.join(localTools, "temp");
const emulatorSet = ["auth"];
if (process.argv.includes("--firestore")) emulatorSet.push("firestore");
if (process.argv.includes("--storage")) emulatorSet.push("storage");
if (process.argv.includes("--functions")) emulatorSet.push("functions");
const enabledEmulators = emulatorSet.join(",");
const npxArgs = ["exec", "--yes", "--package=firebase-tools@15.34.0", "--", "firebase", "emulators:start", "--only", enabledEmulators, "--project", "demo-smartsolutiontek"];

function findJavaHome() {
  if (existsSync(bundledJava)) return bundledJavaHome;
  if (process.env.JAVA_HOME && existsSync(path.join(process.env.JAVA_HOME, "bin", "java.exe"))) return process.env.JAVA_HOME;
  const result = spawnSync("where.exe", ["java"], { encoding: "utf8", windowsHide: true });
  const javaPath = result.status === 0 ? result.stdout.split(/\r?\n/).find(Boolean) : undefined;
  return javaPath ? path.dirname(path.dirname(javaPath)) : null;
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error("Firebase Emulator Suite requires Java 11+. Set JAVA_HOME or add a local JRE under .tools/temurin-21-jre/.");
  process.exit(1);
}

const childEnvironment = {
  ...process.env,
  FUNCTION_STORAGE_BUCKET: "demo-smartsolutiontek.appspot.com",
  JAVA_HOME: javaHome,
  USERPROFILE: localProfile,
  TEMP: localTemp,
  TMP: localTemp,
  npm_config_cache: npmCache,
  PATH: `${path.join(javaHome, "bin")};${process.env.PATH || ""}`,
};
mkdirSync(localProfile, { recursive: true });
mkdirSync(npmCache, { recursive: true });
mkdirSync(localTemp, { recursive: true });

if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify({ projectId: "demo-smartsolutiontek", emulators: enabledEmulators.split(","), javaHome, localProfile, npmCache, localTemp, command: `npm ${npxArgs.join(" ")}` }, null, 2));
  process.exit(0);
}

const child = spawn("npm.cmd", npxArgs, { cwd: projectRoot, env: childEnvironment, stdio: "inherit", shell: true, windowsHide: true });
child.on("error", (error) => {
  console.error(`Could not start the Firebase Auth emulator: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
