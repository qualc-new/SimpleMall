# 与 deploy/tcb/Dockerfile 保持同步（云托管云端构建默认读取根目录 Dockerfile）
# SimpleMall API — TCB 云托管（Prisma → 云开发 MySQL，构建上下文为 Monorepo 根目录）
FROM node:20-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
  && apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

RUN printf 'shamefully-hoist=true\n' > .npmrc

COPY . .

RUN pnpm config set registry https://mirrors.cloud.tencent.com/npm/ \
  && pnpm install --frozen-lockfile

RUN pnpm --filter @simplemall/api exec prisma generate \
  && pnpm --filter @simplemall/api build

# deploy 产物内 .prisma/client 仅为占位，需从构建树拷贝 prisma generate 完整引擎
RUN pnpm deploy --filter @simplemall/api --prod /out \
  && set -e; \
  SRC=$(find /app/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -1)/node_modules/.prisma/client; \
  DST=$(find /out/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -1)/node_modules/.prisma/client; \
  rm -rf "$DST"; \
  cp -r "$SRC" "$DST"; \
  test "$(ls -1 "$DST" | wc -l)" -ge 15

FROM node:20-alpine AS runner

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
  && apk add --no-cache openssl tzdata \
  && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo Asia/Shanghai > /etc/timezone

WORKDIR /app

COPY --from=builder /out ./
COPY --from=builder /app/apps/api/prisma ./prisma

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai
ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", "dist/main.js"]
