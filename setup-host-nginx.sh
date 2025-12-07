#!/bin/bash

# Setup script for host nginx error pages
# Run this on your VPS

echo "🔧 Setting up host nginx for INTRAK custom error pages..."

# Create error pages directory
sudo mkdir -p /var/www/intrak/errors

# Copy error page HTML
sudo cp client/public/502.html /var/www/intrak/errors/502.html

# Set permissions
sudo chown -R www-data:www-data /var/www/intrak
sudo chmod -R 755 /var/www/intrak

echo "✅ Error pages directory created at /var/www/intrak/errors"
echo ""
echo "📝 Next steps:"
echo "1. Copy nginx-host-config.conf to /etc/nginx/sites-available/intrak"
echo "2. Update SSL certificate paths in the config"
echo "3. Create symlink: sudo ln -s /etc/nginx/sites-available/intrak /etc/nginx/sites-enabled/"
echo "4. Test config: sudo nginx -t"
echo "5. Reload nginx: sudo systemctl reload nginx"

