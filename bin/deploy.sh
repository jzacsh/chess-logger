#!/usr/bin/env bash

UPLOADED_LOG="$1"
printf '' > "$UPLOADED_LOG"

REMOTE_BUCKET='s3://jzacsh.com-chess/'
DIR_BIN="$(readlink -f "$(dirname "${BASH_SOURCE[0]}")")"
DIR_REPO="$(readlink -f "${DIR_BIN}/..")"
LOCAL_SRC="$DIR_REPO/dist/"
[[ -d "$LOCAL_SRC" && -r "$LOCAL_SRC" ]] || {
  printf '
    ERROR: the following does not seem to be repository:
    \t"%s"
    .. Cannot find dist/ dump!
  \r' "$DIR_REPO" >&2
  exit 1
}

printf 'Deploying files from:\n\t%s\nto:\n\t%s\n\n\n' \
    "$LOCAL_SRC" \
    "$REMOTE_BUCKET"

# See https://github.com/aws/aws-cli for more

AWS_SYNC_LOG="$(mktemp)"

aws s3 sync \
  --delete \
  --acl="public-read" \
  "$LOCAL_SRC" "$REMOTE_BUCKET" \
  | tee -a "$AWS_SYNC_LOG"

# Cleanup awscli output:
sed -e 's/^.*//g' "$AWS_SYNC_LOG" | \
  grep 'upload: ' | \
  sed -e 's|^upload:\ ||' | \
  sed -e 's|\ to\ s3://.*$||' | \
  sed -e 's|^dist/|/|' | \
  sed -e '/^[:space:]*$/'d > "$UPLOADED_LOG"

rm "$AWS_SYNC_LOG"

# Set cache manifest HTTP header
aws s3 cp \
  --acl="public-read" \
  --content-type="text/cache-manifest" \
  "${LOCAL_SRC}/chess-jzacsh-com.manifest" "$REMOTE_BUCKET"
