# Use Node image
FROM node:18

# Create app directory
WORKDIR /app

# Copy source files
COPY . .

# Install dependencies
RUN npm install

# Expose backend port
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]
