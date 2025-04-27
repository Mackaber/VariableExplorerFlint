# Use the official Redis image from Docker Hub
FROM redis:latest

# Expose Redis default port
EXPOSE 6379

# Command to run Redis server
CMD ["redis-server"]
