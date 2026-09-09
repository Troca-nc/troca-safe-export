#!/usr/bin/env sh
set -eu

test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT
mkdir -p "$test_dir/source/uploads" "$test_dir/source/letsencrypt" "$test_dir/source/config-template"
printf '%s\n' 'CREATE TABLE recovery_probe(id integer);' > "$test_dir/source/postgres.sql"
printf '%s\n' 'upload probe' > "$test_dir/source/uploads/probe.txt"
printf '%s\n' 'certificate probe' > "$test_dir/source/letsencrypt/probe.pem"
printf '%s\n' 'NODE_ENV=production' > "$test_dir/source/.env.production.local"
printf '%s\n' 'services: {}' > "$test_dir/source/config-template/docker-compose.prod.yml"

age-keygen --output "$test_dir/identity.txt" >/dev/null 2>&1
recipient="$(age-keygen -y "$test_dir/identity.txt")"
tar -C "$test_dir/source" -czf - . | age --recipient "$recipient" --output "$test_dir/probe.tar.gz.age"
(cd "$test_dir" && sha256sum probe.tar.gz.age > probe.tar.gz.age.sha256)

/verify-backup.sh "$test_dir/probe.tar.gz.age" "$test_dir/probe.tar.gz.age.sha256" "$test_dir/identity.txt"
