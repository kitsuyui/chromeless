#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

exec find build-resources -type f -name '*.sh' -exec shellcheck {} +
