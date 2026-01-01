#!/bin/bash

NEW_VERSION=""

if [ -n "$GITHUB_REF_NAME" ]; then
    NEW_VERSION=$GITHUB_REF_NAME
    echo "Using GitHub Ref: $NEW_VERSION"
else
    NEW_VERSION=$(git describe --tags $(git rev-list --tags --max-count=1) 2>/dev/null)
    echo "Using Local Git Tag: $NEW_VERSION"
fi

if [ -z "$NEW_VERSION" ]; then
    echo "Error: Could not determine version number."
    exit 1
fi

CLEAN_VERSION=${NEW_VERSION#v}

sed -i "3s|\"version\": \"[^\"]*\"|\"version\": \"${CLEAN_VERSION}\"|" package.json

echo "Successfully updated package.json to version: ${CLEAN_VERSION}"