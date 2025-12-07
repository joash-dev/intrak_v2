# Nginx Custom Error Pages Configuration

If you want Nginx to serve custom error pages directly (before requests reach the React app), you can configure it like this:

## Configuration

Add this to your Nginx configuration file (usually `/etc/nginx/sites-available/intrak` or similar):

```nginx
server {
    listen 80;
    server_name intrak.site www.intrak.site;

    # ... your existing configuration ...

    # Custom error pages
    error_page 404 /error/404;
    error_page 500 502 503 504 /error/500;
    
    # Proxy to React app for error pages
    location /error {
        proxy_pass http://localhost:8080;  # Your React app port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Your existing proxy configuration for the React app
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Alternative: Static HTML Error Pages

If you prefer static HTML error pages:

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /404.html {
    root /var/www/intrak/errors;
    internal;
}

location = /50x.html {
    root /var/www/intrak/errors;
    internal;
}
```

## Testing

After updating Nginx configuration:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Notes

- The React app will handle errors that come through API calls (502, 503, 504 from backend)
- Nginx error pages will handle errors at the web server level
- For 502 errors specifically, check:
  1. Is the backend server running? (`docker ps` or `pm2 list`)
  2. Is the backend accessible on port 5000?
  3. Are there any firewall rules blocking the connection?

