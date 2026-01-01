#!/usr/bin/env sh

GIT_TAG=$(git describe --tags $(git rev-list --tags --max-count=1))

sed -i "3s/\"version\": \"[^\"]*\"/\"version\": \"${GIT_TAG}\"/" package.json