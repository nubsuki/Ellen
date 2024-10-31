# Use an official Node.js runtime as the base image
FROM node:lts-alpine

# Install FFmpeg and other necessary dependencies
RUN apk add --no-cache ffmpeg python3

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies, and retry if the network fails
RUN npm install

# Copy the rest of the application code
COPY . .

# Command to run the application
CMD ["node", "ellen.js"]
