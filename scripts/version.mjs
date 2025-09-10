#!/usr/bin/env node

/**
 * This runs after `npm version` command updates the version but before changes are commited.
 * This will update the `cargo.toml` version to match the new `package.json` verson.
 * This will also update the `package.json` optional native dependencies
 * to match the same version as the version of this package.
 * This maintains the same version between this master package
 * and the optional native dependencies.
 * At the same time, the `package-lock.json` is also regenerated.
 * Note that at this point, the new optional native dependencies have
 * not yet been published, so the `--package-lock-only` flag is used
 * to prevent `npm` from attempting to download unpublished packages.
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import url from 'node:url';
import childProcess from 'node:child_process';
import packageJSON from '../package.json' with { type: 'json' };

const platform = os.platform();

const projectPath = path.dirname(
  path.dirname(url.fileURLToPath(import.meta.url)),
);

/* eslint-disable no-console */
async function main() {
  const cargoTOMLPath = path.join(projectPath, 'Cargo.toml');
  const cargoLockPath = path.join(projectPath, 'Cargo.lock');

  console.error('Updating the Cargo.toml version to match new version');
  const cargoTOML = await fs.promises.readFile(cargoTOMLPath, 'utf-8');
  const cargoTOMLMatch = cargoTOML.match(/version\s*=\s*"(.*)"/);
  const cargoTOMLUpdated = cargoTOML.replace(
    cargoTOMLMatch[0],
    `version = "${packageJSON.version}"`,
  );
  await fs.promises.writeFile(cargoTOMLPath, cargoTOMLUpdated, 'utf-8');

  console.error('Updating the Cargo.lock version to match new version');
  childProcess.execFileSync('cargo', ['update', '--package', 'quic'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    windowsHide: true,
    encoding: 'utf-8',
    shell: platform === 'win32' ? true : false,
  });

  console.error('Staging Cargo.toml and Cargo.lock');
  childProcess.execFileSync('git', ['add', cargoTOMLPath, cargoLockPath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    windowsHide: true,
    encoding: 'utf-8',
    shell: platform === 'win32' ? true : false,
  });

  console.error(
    'Updating the package.json with optional native dependencies and package-lock.json',
  );
  const optionalDepsNative = [];
  for (const key in packageJSON.optionalDependencies) {
    if (key.startsWith(packageJSON.name)) {
      optionalDepsNative.push(`${key}@${packageJSON.version}`);
    }
  }
  if (optionalDepsNative.length > 0) {
    const installArgs = [
      'install',
      '--ignore-scripts',
      '--silent',
      '--package-lock-only',
      '--save-optional',
      '--save-exact',
      ...optionalDepsNative,
    ];
    console.error('Running npm install:');
    console.error(['npm', ...installArgs].join(' '));
    childProcess.execFileSync('npm', installArgs, {
      stdio: ['inherit', 'inherit', 'inherit'],
      windowsHide: true,
      encoding: 'utf-8',
      shell: platform === 'win32' ? true : false,
    });
    console.error('Running npm install again to update the package-lock.json:');
    const installArgs_ = [
      'install',
      '--ignore-scripts',
      '--silent',
      '--package-lock-only',
    ];
    childProcess.execFileSync('npm', installArgs_, {
      stdio: ['inherit', 'inherit', 'inherit'],
      windowsHide: true,
      encoding: 'utf-8',
      shell: platform === 'win32' ? true : false,
    });
  }
}
/* eslint-enable no-console */

void main();
