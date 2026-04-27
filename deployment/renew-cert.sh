#!/bin/bash
set -e

PROJECT_DIR="/home/administrator/loop-lm"
cd "$PROJECT_DIR"

{
    docker run --rm --network host \
    -v "$PROJECT_DIR/deployment/conf:/etc/letsencrypt" \
    -v "$PROJECT_DIR/deployment/www:/var/www/certbot" \
    certbot/certbot renew --quiet

    docker compose -f "$PROJECT_DIR/deployment/docker-compose.yml" --env-file "$PROJECT_DIR/deployment/.env.docker" exec -T nginx nginx -s reload

    echo "$(date): SUCCESS - Cert renewal check finished"
} >> "$PROJECT_DIR/deployment/looplm-renewal.log" 2>&1