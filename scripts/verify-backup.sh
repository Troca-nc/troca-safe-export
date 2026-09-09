#!/usr/bin/env sh
set -eu

archive="${1:?Usage: verify-backup.sh ARCHIVE CHECKSUM AGE_IDENTITY}"
checksum="${2:?Usage: verify-backup.sh ARCHIVE CHECKSUM AGE_IDENTITY}"
identity="${3:?Usage: verify-backup.sh ARCHIVE CHECKSUM AGE_IDENTITY}"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

archive_dir="$(dirname "$archive")"
archive_name="$(basename "$archive")"
checksum_name="$(basename "$checksum")"
sed "s#  .*#  $archive_name#" "$checksum" > "$work_dir/$checksum_name"
(cd "$archive_dir" && sha256sum -c "$work_dir/$checksum_name")

age --decrypt --identity "$identity" --output "$work_dir/backup.tar.gz" "$archive"
tar -C "$work_dir" -xzf "$work_dir/backup.tar.gz"

test -s "$work_dir/postgres.sql"
test -d "$work_dir/uploads"
test -d "$work_dir/letsencrypt"
test -s "$work_dir/.env.production.local"
test -d "$work_dir/config-template"

echo "Backup integrity and recovery structure verified: $archive_name"
