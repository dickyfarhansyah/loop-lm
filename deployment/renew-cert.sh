#!/bin/bash
set -e

PROJECT_DIR="/home/administrator/loop-lm"
cd "$PROJECT_DIR"

docker run --rm --network host \
-v "$PROJECT_DIR/deployment/conf:/etc/letsencrypt" \
-v "$PROJECT_DIR/deployment/www:/var/www/certbot" \
certbot/certbot renew --quiet

docker compose -f "deployment/docker-compose.yml" --env-file "deployment/.env.docker" exec -T nginx nginx -s reload

echo "$(date): Cert renewal check finished" >> deployment/looplm-renewal.log"