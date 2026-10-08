# Nächtliches Backup: pg_dump + Medien → restic-Repository (verschlüsselt).
FROM alpine:3.22
RUN apk add --no-cache restic postgresql17-client tzdata curl
COPY backup.sh restore-test.sh scheduler.sh /usr/local/bin/
ENV TZ=Europe/Berlin
CMD ["/usr/local/bin/scheduler.sh"]
