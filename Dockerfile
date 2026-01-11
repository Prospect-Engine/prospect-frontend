## Stage 1 (production base // debian 10 (buster) slim (mini size))
FROM node:20.16 as base

ENV PATH="/usr/src/app/node_modules/.bin:$PATH" \
  NODE_ENV="production" \
  NODE_CONFIG_ENV="production"

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json yarn.lock* ./

## Stage 2 (This is where we build a production optimized output)
FROM base AS build

ARG NPM_TOKEN
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_MINIO_ID
ARG NEXT_PUBLIC_MINIO_KEY
ARG NEXT_PUBLIC_CRM_BACKEND_URL
ARG NEXT_PUBLIC_CRM_HOST
ARG NEXT_PUBLIC_WHITE_WALKER_SOCKET_URL

WORKDIR /usr/src/app

COPY . .

# Install dependencies and build the application
RUN if [ -n "$NPM_TOKEN" ]; then \
      echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc; \
    fi && \
    yarn install --production=false && \
    yarn build && \
    rm -rf node_modules && \
    yarn install --production && \
    yarn add typescript && \
    yarn cache clean && \
    rm -f .npmrc

## Stage 3 (image ready for dev)
FROM build AS dev

ENV NODE_CONFIG_ENV="dev" \
    NODE_ENV="development"

WORKDIR /usr/src/app

# Install dev dependencies for development
RUN yarn install --production=false

RUN chmod +x ./start.sh

EXPOSE 3000

CMD [ "./start.sh" ]

## Stage 4 (image ready for stage)
FROM build AS stage

ENV NODE_CONFIG_ENV="stage" \
    NODE_ENV="production"

WORKDIR /usr/src/app

RUN chmod +x ./start.sh

EXPOSE 3000

CMD [ "./start.sh" ]

## Stage 5 (image ready for prod)
FROM build AS prod

ENV NODE_CONFIG_ENV="production" \
    NODE_ENV="production"

WORKDIR /usr/src/app

RUN chmod +x ./start.sh

EXPOSE 3000

CMD [ "./start.sh" ]

## Stage 6 (local)
# we don't COPY in this stage because for dev as compose will bind-mount anyway
# this saves time when building locally for dev via docker-compose
FROM base AS local

ARG NPM_TOKEN

ENV NODE_ENV="development" \
  NODE_CONFIG_ENV="local"

WORKDIR /usr/src/app

RUN if [ -n "$NPM_TOKEN" ]; then \
      echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc; \
    fi && \
    yarn install && \
    rm -f .npmrc

EXPOSE 3000

CMD [ "yarn", "dev" ]
