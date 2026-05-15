#!/bin/bash
npm run build
scp -r dist/* ubuntu@43.157.224.84:/tmp/cfo-web/
ssh ubuntu@43.157.224.84 "sudo cp -r /tmp/cfo-web/* /var/www/cfo-sentinel-web/ && echo '✅ Done'"
echo "🌐 https://cfosentinel.my.id"