FROM alpine:3.20

RUN apk add --no-cache age bash ca-certificates postgresql-client aws-cli tar tzdata

WORKDIR /app

COPY scripts/backup.sh /backup.sh
COPY docker-compose.prod.yml /recovery/config-template/docker-compose.prod.yml
COPY nginx /recovery/config-template/nginx
COPY docker/nginx/entrypoint.sh /recovery/config-template/docker/nginx/entrypoint.sh

RUN chmod +x /backup.sh \
  && mkdir -p /backups /var/log \
  && printf '0 2 * * * /backup.sh >> /var/log/backup.log 2>&1\n' > /etc/crontabs/root

VOLUME ["/backups"]

CMD ["crond", "-f", "-l", "8"]
