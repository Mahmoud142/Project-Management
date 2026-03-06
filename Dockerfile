# 1. Get a light and fast Node.js version
FROM node:20-alpine

# 2. Create a working directory inside the container
WORKDIR /app

# 3. Copy package files first to install dependencies
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the project code
COPY . .

# 6. Expose port 3000 for the API server
EXPOSE 3000

# 7. Command to run the server
CMD ["node", "server.js"]