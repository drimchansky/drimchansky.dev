# Use the official Playwright Docker image as base
FROM mcr.microsoft.com/playwright:v1.54.2-noble

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Set environment variables
ENV CI=true
ENV SITE_URL=http://localhost:4321

# Build the application
RUN pnpm build

# Expose the port that Astro runs on
EXPOSE 4321

# Default command to run tests
CMD ["pnpm", "exec", "playwright", "test"]
