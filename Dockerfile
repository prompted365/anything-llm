########################
# ── 1. COMMON BASE ── #
########################
FROM ubuntu:jammy-20240627.1 AS base

ARG ARG_UID=1000
ARG ARG_GID=1000

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# System deps + Node 18 + Yarn 1.x + uv/uvx
RUN set -ex \
 && export DEBIAN_FRONTEND=noninteractive \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      unzip curl gnupg libgfortran5 libgbm1 tzdata netcat \
      libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
      libfontconfig1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
      libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
      libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
      ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release \
      xdg-utils git build-essential ffmpeg \
 && mkdir -p /etc/apt/keyrings \
 && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
 && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends nodejs \
 && curl -LO https://github.com/yarnpkg/yarn/releases/download/v1.22.19/yarn_1.22.19_all.deb \
 && dpkg -i yarn_1.22.19_all.deb \
 && rm yarn_1.22.19_all.deb \
 && curl -LsSf https://astral.sh/uv/0.6.10/install.sh | sh \
 && mv /root/.local/bin/uv{,x} /usr/local/bin/ \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Dedicated user
RUN groupadd -g ${ARG_GID} anythingllm \
 && useradd  -u ${ARG_UID} -m -s /bin/bash -g anythingllm anythingllm \
 && mkdir -p /app/{frontend,server,collector} \
 && chown -R anythingllm:anythingllm /app

# Helper scripts / env template
COPY docker/docker-entrypoint.sh  /usr/local/bin/
COPY docker/docker-healthcheck.sh /usr/local/bin/
COPY --chown=anythingllm:anythingllm docker/.env.example /app/server/.env
RUN chmod +x /usr/local/bin/docker-*.sh

#############################
# ── 2. ARCH-SPECIFIC SET ── #
#############################
FROM base AS build-arm64
RUN echo "▶ Building for arm64"
USER anythingllm
WORKDIR /app
# Puppeteer-chromium patch
RUN curl -L https://playwright.azureedge.net/builds/chromium/1088/chromium-linux-arm64.zip -o chrome-linux.zip \
 && unzip chrome-linux.zip && rm chrome-linux.zip
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_PATH=/app/chrome-linux/chrome \
    PUPPETEER_EXECUTABLE_PATH=/app/chrome-linux/chrome

FROM base AS build-amd64
RUN echo "▶ Building for amd64 / x86_64"

################################################
# ── 3. COMMON APP LAYERS (uses $TARGETARCH) ── #
################################################
FROM build-${TARGETARCH} AS build
USER anythingllm
WORKDIR /app

# ── 3-A. Frontend ──
FROM build AS frontend-build
COPY --chown=anythingllm:anythingllm frontend/ ./frontend/
WORKDIR /app/frontend
RUN yarn install --frozen-lockfile --network-timeout 100000 \
 && yarn build \
 && mkdir -p /tmp/frontend && cp -r dist /tmp/frontend \
 && yarn cache clean

# ── 3-B. Server / Backend ──
FROM build AS backend-build
COPY --chown=anythingllm:anythingllm server/ ./server/
WORKDIR /app/server
RUN yarn install --production --frozen-lockfile --network-timeout 100000 \
 && yarn cache clean

# ── 3-C. Collector ──
FROM backend-build AS collector-build
COPY --chown=anythingllm:anythingllm collector/ ./collector/
WORKDIR /app/collector
ENV PUPPETEER_DOWNLOAD_BASE_URL=https://storage.googleapis.com/chrome-for-testing-public
RUN yarn install --production --frozen-lockfile --network-timeout 100000 \
 && yarn cache clean

#####################################################
# ── 4. FINAL IMAGE (frontend + backend + collector) ──
#####################################################
FROM backend-build AS production
USER anythingllm
WORKDIR /app

# Inject built frontend into the server’s public dir
COPY --from=frontend-build /tmp/frontend/dist /app/server/public
# Collector deps already baked in /app/collector

ENV NODE_ENV=production \
    ANYTHING_LLM_RUNTIME=docker

HEALTHCHECK --interval=1m --timeout=10s --start-period=1m CMD /bin/bash /usr/local/bin/docker-healthcheck.sh || exit 1
ENTRYPOINT ["/bin/bash", "/usr/local/bin/docker-entrypoint.sh"]