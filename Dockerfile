FROM --platform=${BUILDPLATFORM} ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    build-essential \
    libssl-dev \
    pkg-config \
    python3 \
    cmake \
    sudo \
    && rm -rf /var/lib/apt/lists/*

USER root
RUN mkdir /nix 
RUN chmod 0755 /nix 
RUN chown root:root /nix

RUN mkdir -p /tmp/nix
RUN echo "filter-syscalls = false" >> /tmp/nix/nix.conf

RUN curl -L https://nixos.org/nix/install -o /tmp/install-nix.sh
RUN NIX_CONF_DIR=/tmp/nix bash /tmp/install-nix.sh --daemon

RUN mkdir -p /etc/nix
RUN echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf

RUN useradd -m -s /bin/bash dev
RUN usermod -aG nixbld dev
RUN echo "dev ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/dev

RUN chown -R dev:nixbld /nix

ENV HOME=/home/dev
ENV PATH=/home/dev/.nix-profile/bin:/home/dev/.nix-profile/sbin:/nix/var/nix/profiles/default/bin:$PATH

USER dev
WORKDIR /home/dev/app

CMD ["nix", "develop"]
