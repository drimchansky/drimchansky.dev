FROM mcr.microsoft.com/playwright:v1.55.0-noble

RUN apt-get update && apt-get install -y git-lfs && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN git lfs install

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

ENV SITE_URL=http://localhost:4321
RUN pnpm build

EXPOSE 4321

ENV CI=true
ENV SITE_URL=http://localhost:4321

CMD ["pnpm", "exec", "playwright", "test"]
