# Nginx log rotation

Production Nginx writes access and error logs to the bind-mounted
`nginx/logs` directory. Rotate them through the running container so Nginx
reopens the files safely before archived logs are compressed.

Dry run:

```bash
scripts/rotate-nginx-logs.sh --dry-run
```

Manual rotation:

```bash
scripts/rotate-nginx-logs.sh
```

Recommended user crontab entry (daily at 00:15 UTC):

```cron
15 0 * * * /opt/kalico/scripts/rotate-nginx-logs.sh >> /home/kalico-app/nginx-log-rotation.log 2>&1
```

Archived logs are compressed and retained for 14 days by default. Override
the retention with `NGINX_LOG_RETENTION_DAYS` when invoking the script.
