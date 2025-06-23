#!/bin/bash

set -ex

docker build --platform=linux/amd64 --security-opt seccomp=unconfined -t js-quic-dev .
docker run --platform=linux/amd64 --security-opt seccomp=unconfined -it --rm -v .:/home/dev/app js-quic-dev
