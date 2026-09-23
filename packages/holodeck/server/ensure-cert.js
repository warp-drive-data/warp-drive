#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { homedir, userInfo } from 'os';
import path from 'path';

const DEFAULT_CERT_PATH = path.join(homedir(), 'holodeck-localhost.pem');
const DEFAULT_KEY_PATH = path.join(homedir(), 'holodeck-localhost-key.pem');

const MKCERT_INSTALL_HINT = `
mkcert was not found on your PATH. Holodeck serves over TLS and uses mkcert to
issue a certificate for localhost.

  macOS    brew install mkcert
  Linux    sudo apt install libnss3-tools
           then install mkcert from https://github.com/FiloSottile/mkcert/releases
  Windows  choco install mkcert

Install it and run this command again.
`;

/**
 * `userInfo().shell` reports the login shell from the password database, which
 * is not necessarily the shell the user is running. `$SHELL` is.
 */
function getShell() {
  return process.env.SHELL || userInfo().shell;
}

/**
 * Shells differ in where they read startup config from. A shell that isn't
 * listed here still gets a working certificate, it just has to export the
 * paths itself.
 */
function getShellConfigFilePath(shell) {
  switch (path.basename(shell ?? '')) {
    case 'zsh':
      return path.join(homedir(), '.zshrc');
    case 'bash':
      return path.join(homedir(), '.bashrc');
    case 'fish':
      return path.join(homedir(), '.config', 'fish', 'config.fish');
    default:
      return null;
  }
}

function formatEnvLines(shell, vars) {
  const isFish = path.basename(shell ?? '') === 'fish';

  return Object.entries(vars)
    .map(([name, value]) => (isFish ? `set -gx ${name} "${value}"` : `export ${name}="${value}"`))
    .join('\n');
}

function hasMkcert() {
  try {
    execSync('mkcert -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (!hasMkcert()) {
    console.error(MKCERT_INSTALL_HINT);
    process.exitCode = 1;
    return;
  }

  const CERT_PATH = process.env.HOLODECK_SSL_CERT_PATH ?? DEFAULT_CERT_PATH;
  const KEY_PATH = process.env.HOLODECK_SSL_KEY_PATH ?? DEFAULT_KEY_PATH;

  if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
    console.log('SSL certificate or key not found, generating new ones...');

    fs.mkdirSync(path.dirname(CERT_PATH), { recursive: true });
    fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true });
    execSync(`mkcert -install`);
    execSync(`mkcert -key-file ${KEY_PATH} -cert-file ${CERT_PATH} localhost`);

    console.log('SSL certificate and key generated.');
  } else {
    console.log('SSL certificate and key found, using existing.');
  }

  console.log(`Certificate path: ${CERT_PATH}`);
  console.log(`Key path: ${KEY_PATH}`);

  if (process.env.HOLODECK_SSL_CERT_PATH && process.env.HOLODECK_SSL_KEY_PATH) {
    return;
  }

  const shell = getShell();
  const envLines = formatEnvLines(shell, {
    HOLODECK_SSL_CERT_PATH: CERT_PATH,
    HOLODECK_SSL_KEY_PATH: KEY_PATH,
  });
  const configFilePath = getShellConfigFilePath(shell);

  if (!configFilePath) {
    console.log(
      `\nCould not determine a startup file for shell: ${shell ?? 'unknown'}.` +
        `\nHolodeck falls back to ${DEFAULT_CERT_PATH} when the environment variables` +
        `\nare unset, so the certificate above already works as it is.` +
        `\nTo set them anyway, add the equivalent of these lines to your shell config:\n\n${envLines}\n`
    );
    return;
  }

  fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
  fs.appendFileSync(configFilePath, `\n${envLines}\n`);
  console.log(`\nAdded HOLODECK_SSL_CERT_PATH and HOLODECK_SSL_KEY_PATH to ${configFilePath}`);
  console.log(`*** Restart your terminal session or run \`source ${configFilePath}\` to apply. ***\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
