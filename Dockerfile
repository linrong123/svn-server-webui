# 多阶段构建 - 构建前端
FROM node:20 AS client-builder
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install
COPY client ./client
COPY server ./server
RUN npm run build:client

# 多阶段构建 - 构建后端
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
COPY server/package.json ./server/
# 先安装所有依赖（包括开发依赖）来构建
RUN npm install --workspace=server
COPY server ./server
COPY --from=client-builder /app/server/public ./server/public
RUN npm run build:server

# 准备生产环境依赖
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
COPY server/package.json ./server/
RUN npm install --workspace=server --omit=dev

# 最终镜像
FROM alpine:3.19
RUN apk add --no-cache \
    apache2 \
    apache2-utils \
    apache2-webdav \
    subversion \
    subversion-tools \
    mod_dav_svn \
    nodejs \
    npm \
    supervisor \
    curl \
    && rm -rf /var/cache/apk/*

# 创建必要的目录
RUN mkdir -p /svn \
    /svn/hooks \
    /var/log/supervisor \
    /app

# 复制Apache配置
COPY docker/apache/httpd.conf /etc/apache2/httpd.conf
COPY docker/apache/dav_svn.conf /etc/apache2/conf.d/dav_svn.conf

# 复制Supervisor配置
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 复制应用程序
WORKDIR /app
COPY --from=server-builder /app/server/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/public ./public

# 复制启动脚本
COPY docker/scripts/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# 设置环境变量
ENV NODE_ENV=production \
    SVN_REPOS_PATH=/svn/repos \
    SVN_CONF_PATH=/svn/conf \
    PORT=5000

# 暴露端口
EXPOSE 80 5000

# 数据卷
VOLUME ["/data"]

# 启动
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]