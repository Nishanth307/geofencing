# Serve through Nginx with reverse proxy & SPA fallback
FROM nginx:alpine

# Copy custom nginx configuration with reverse proxy for /geofences, /vehicles, /ws, etc.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-compiled static assets
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
