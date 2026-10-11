#!/bin/bash
set -e
cd /var/www/cardiff-demo-agent
source .venv/bin/activate
exec python -m uvicorn backend.main:app --host 0.0.0.0 --port 3023 --workers 1
