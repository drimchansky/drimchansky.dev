# Use the official Node.js image as base
FROM node:22-slim

# Install system dependencies required by Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libpixman-1-0 \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libxcb1 \
    libxcb-shm0 \
    libxcb-render0 \
    libxcb-randr0 \
    libxcb-xfixes0 \
    libxcb-shape0 \
    libxcb-keysyms1 \
    libxcb-icccm4 \
    libxcb-xkb1 \
    libxcb-xinerama0 \
    libxcb-xinput0 \
    libxcb-util1 \
    libxcb-image0 \
    libxcb-xtest0 \
    libxcb-sync1 \
    libxcb-present0 \
    libxcb-dri3-0 \
    libxcb-glx0 \
    libxcb-shape0 \
    libxcb-keysyms1 \
    libxcb-icccm4 \
    libxcb-xkb1 \
    libxcb-xinerama0 \
    libxcb-xinput0 \
    libxcb-util1 \
    libxcb-image0 \
    libxcb-xtest0 \
    libxcb-sync1 \
    libxcb-present0 \
    libxcb-dri3-0 \
    libxcb-glx0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy the rest of the application
COPY . .

# Command to run tests
CMD ["pnpm", "test"] 
