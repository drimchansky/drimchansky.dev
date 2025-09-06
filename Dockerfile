# Use the official Playwright Docker image as base
FROM mcr.microsoft.com/playwright:v1.54.2-noble

# Install Git LFS
RUN apt-get update && apt-get install -y git-lfs && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Initialize Git LFS
RUN git lfs install

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Set environment variables for build
ENV SITE_URL=http://localhost:4321

# Build the application
RUN pnpm build

# Expose the port that Astro runs on
EXPOSE 4321

# Set environment variables
ENV CI=true
ENV SITE_URL=http://localhost:4321

# Default command to run tests
CMD ["pnpm", "exec", "playwright", "test"]
