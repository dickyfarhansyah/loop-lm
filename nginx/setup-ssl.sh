#!/bin/bash
# Setup nginx + self-signed SSL for Cloudflare Full mode
# Run as root: sudo bash nginx/setup-ssl.sh

set -e

DOMAIN="apps.wiratek.ai"
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CONF_SRC="$(dirname "$0")/${DOMAIN}.conf"

echo "==> [1/4] Generate self-signed certificate (valid 10 years)"
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "${KEY_DIR}/${DOMAIN}.key" \
  -out "${CERT_DIR}/${DOMAIN}.crt" \
  -subj "/CN=${DOMAIN}"

chmod 600 "${KEY_DIR}/${DOMAIN}.key"
echo "    Cert: ${CERT_DIR}/${DOMAIN}.crt"
echo "    Key:  ${KEY_DIR}/${DOMAIN}.key"

echo "==> [2/4] Copy nginx config"
cp "${CONF_SRC}" "${NGINX_AVAILABLE}/${DOMAIN}"

echo "==> [3/4] Enable site"
ln -sf "${NGINX_AVAILABLE}/${DOMAIN}" "${NGINX_ENABLED}/${DOMAIN}"

echo "==> [4/4] Test & reload nginx"
nginx -t
systemctl reload nginx

echo ""
echo "Done! nginx is serving ${DOMAIN}"
echo ""
echo "Pastikan di Cloudflare:"
echo "  SSL/TLS -> Overview -> SSL Mode: Full"
echo "  DNS -> A record ${DOMAIN} -> IP server ini -> Proxied (orange cloud)"
