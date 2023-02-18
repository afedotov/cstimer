#!/usr/bin/env bash
#

[[ -f 'Makefile' ]] || { 
    echo "ERROR: Run this script from project root directory"
    exit 1
}

echo
echo "csTimer local HTTP URL: http://localhost:8080/cstimer/"
echo "csTimer local HTTPS URL: https://localhost:8443/cstimer/"
echo

docker run \
    --name cstimer_serve \
    --hostname localhost \
    -a STDIN -a STDOUT -a STDERR \
    --rm \
    -p 8080:80 \
    -p 8443:443 \
    -v "$PWD/dist:/var/www/html/cstimer" \
    -v "$PWD/docker:/mnt/docker" \
    php:apache \
    /mnt/docker/entrypoint-serve.sh

