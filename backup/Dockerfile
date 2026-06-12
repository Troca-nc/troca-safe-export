FROM alpine:3.20

RUN apk add --no-cache bash ca-certificates postgresql-client aws-cli tzdata

WORKDIR /app

COPY scripts/backup.sh /backup.sh

RUN chmod +x /backup.sh \
  && mkdir -p /backups /var/log \
  && printf '0 2 * * * /backup.sh >> /var/log/backup.log 2>&1\n' > /etc/crontabs/root

VOLUME ["/backups"]

CMD ["crond", "-f", "-l", "8"]
