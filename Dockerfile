# 1st stage : build !
FROM node:12.14.0 as builder

RUN mkdir /app
WORKDIR /app

COPY package.json .
RUN npm install

COPY src /app/src
COPY tsconfig.json /app
RUN npm run build -- --prod

# 2nd stage : run !
FROM node:12.14.0

RUN mkdir /app
WORKDIR /app

ENV NODE_PATH=.

COPY --from=builder /app/build /app
COPY --from=builder /app/package.json /app
COPY --from=builder /app/yarn.lock /app

RUN npm install --prod

ENTRYPOINT node server.js