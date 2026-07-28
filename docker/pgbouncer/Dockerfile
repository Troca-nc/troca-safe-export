FROM alpine:3.20

RUN apk add --no-cache pgbouncer ca-certificates bash netcat-openbsd

WORKDIR /etc/pgbouncer

COPY entrypoint.sh /entrypoint.sh

RUN mkdir -p /etc/pgbouncer && \
    chown -R 1000:1000 /etc/pgbouncer && \
    chmod 750 /etc/pgbouncer

RUN chmod +x /entrypoint.sh

EXPOSE 6432

ENTRYPOINT ["/entrypoint.sh"]
