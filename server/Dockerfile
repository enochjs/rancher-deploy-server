FROM node:20-slim

USER root

# 复制并安装 docker-cli
COPY server/docker-cli/docker /usr/local/bin/docker
RUN chmod +x /usr/local/bin/docker

WORKDIR /app

# 先复制依赖清单，加速缓存
COPY server/package.json server/yarn.lock server/tsconfig.json server/nest-cli.json ./
RUN yarn install

# 再复制源码
COPY server/ .

# 构建
RUN yarn build

EXPOSE 9090

CMD ["npm", "run", "start:prod"]
