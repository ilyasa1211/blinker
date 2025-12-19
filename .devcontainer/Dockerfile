FROM node:25-bookworm AS base

ARG USERNAME=node

RUN usermod --shell /usr/bin/bash ${USERNAME} \
  && apt-get update \
  && apt-get install -y sudo \
  && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

USER $USERNAME

RUN sudo apt-get update \
  && sudo apt-get install -y \
  git openssh-client \
  # Install dependencies for electron
  libnspr4 \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0  \
  libatk-bridge2.0-0 \
  libcups2 \
  libgtk-3-0 \
  libgbm1 \
  libasound2 \
  libgl1-mesa-glx \
  libgl1-mesa-dri