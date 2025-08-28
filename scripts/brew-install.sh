#!/usr/bin/env bash

set -o errexit   # abort on nonzero exitstatus
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes

export HOMEBREW_NO_INSTALL_UPGRADE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
export HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK=1
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_ANALYTICS=1

brew reinstall node@20
brew link --overwrite node@20

if brew list --formula cmake &>/dev/null; then
  echo "cmake already present (tap: $(brew info --json=v1 cmake | \
        /usr/bin/python3 -c 'import sys, json; print(json.load(sys.stdin)[0]["tap"])'))"
  # just make sure it is linked
  brew link --overwrite cmake
else
  brew install cmake
  brew link --overwrite cmake
fi

brew install rustup-init
brew link --overwrite rustup-init

# Brew does not provide specific versions of rust
# However rustup provides specific versions
# Here we provide both toolchains
echo "Running rustup-init"
rustup-init --default-toolchain 1.68.2 -y
echo "Adding x86_64-apple-darwin as target"
rustup target add x86_64-apple-darwin
echo "Adding aarch64-apple-darwin as target"
rustup target add aarch64-apple-darwin
echo "Completed brew setup"
