FROM ubuntu:24.04 AS base

FROM base AS node-install

RUN apt-get update && \
  apt-get install -y curl xz-utils

# Install node
RUN curl -LO https://nodejs.org/dist/v25.2.1/node-v25.2.1-linux-x64.tar.xz && \
  mkdir -p /opt/nodejs && \
  tar -xf node-v25.2.1-linux-x64.tar.xz --strip-components=1 --directory=/opt/nodejs

FROM base

ARG USERNAME=ubuntu

RUN usermod --shell /usr/bin/bash ${USERNAME}

RUN apt-get update \
  && apt-get install -y sudo \
  && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

USER $USERNAME

RUN sudo apt-get update && \
  sudo apt-get install -y git openssh-client

# Install rust
RUN curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y && \
  echo . "$HOME/.cargo/env" >> ~/.bashrc

COPY --from=node-install /opt/nodejs /usr/local