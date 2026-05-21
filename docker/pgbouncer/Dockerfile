FROM alpine:3.20

RUN apk add --no-cache pgbouncer ca-certificates bash netcat-openbsd

WORKDIR /etc/pgbouncer

COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.template.txt /etc/pgbouncer/userlist.template.txt
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 6432

ENTRYPOINT ["/entrypoint.sh"]
