#!/usr/bin/env bash
# =============================================================================
# SimpleMall 开发环境一键脚本（详见 README「dev.sh 备注」）
# =============================================================================

# -e：任一命令失败则退出；-u：使用未定义变量报错；-o pipefail：管道中任一环节失败则整条失败
set -euo pipefail

# 脚本所在目录的绝对路径（无论从哪里执行 ./dev.sh 都能定位到项目根）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ROOT  # 导出供 nohup 子 shell 使用
cd "${ROOT}" # 后续 pnpm / docker compose 均在 Monorepo 根目录执行

# 运行时状态目录（日志、pid），已写入 .gitignore
DEV_DIR="${ROOT}/.dev"
LOG_DIR="${DEV_DIR}/logs"
export DEV_DIR LOG_DIR
mkdir -p "${LOG_DIR}"  # 确保日志目录存在

# ---------- 应用端口（可通过环境变量覆盖）----------
API_PORT="${API_PORT:-4000}"     # NestJS API，对应 apps/api
WEB_PORT="${WEB_PORT:-3000}"     # Nuxt 商城，对应 apps/web
ADMIN_PORT="${ADMIN_PORT:-5173}" # Vite 管理后台，对应 apps/admin

# ---------- 基础设施端口（用于检测 MySQL/Redis 是否可连接）----------
MYSQL_PORT="${MYSQL_PORT:-3306}" # 与 docker-compose.yml ports 一致
REDIS_PORT="${REDIS_PORT:-6379}" # 与 docker-compose.yml ports 一致

# ---------- Docker Compose 相关路径与容器名 ----------
COMPOSE_FILE="${ROOT}/docker-compose.yml" # compose 文件绝对路径
CONTAINER_MYSQL="simplemall-mysql"        # 须与 compose 中 container_name 一致
CONTAINER_REDIS="simplemall-redis"        # 须与 compose 中 container_name 一致

# ---------- 终端颜色（log / warn / err 输出用）----------
RED='\033[0;31m'    # 红色：错误
GREEN='\033[0;32m'  # 绿色：正常
YELLOW='\033[1;33m' # 黄色：警告
NC='\033[0m'        # 重置样式

# 绿色信息日志
log()  { echo -e "${GREEN}[dev]${NC} $*"; }
# 黄色警告日志
warn() { echo -e "${YELLOW}[dev]${NC} $*"; }
# 红色错误日志（输出到 stderr）
err()  { echo -e "${RED}[dev]${NC} $*" >&2; }

# 检查命令是否存在，$1=命令名
need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "未找到命令: $1"; exit 1; }
}

# 封装 docker compose，统一 -f 指定 compose 文件
compose() {
  docker compose -f "${COMPOSE_FILE}" "$@"
}

# =============================================================================
# Docker 基础设施
# =============================================================================

# 检查 Docker CLI 是否安装、Docker 引擎是否已启动
check_docker_daemon() {
  if ! command -v docker >/dev/null 2>&1; then
    err "未安装 Docker CLI。"
    err "请安装 Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    err "Docker 引擎未运行。"
    err "请先启动 Docker Desktop（菜单栏鲸鱼图标就绪后再执行 ./dev.sh）。"
    exit 1
  fi
}

# 判断指定名称的容器是否处于 running 状态，$1=容器名
container_is_running() {
  local name=$1
  [[ "$(docker inspect -f '{{.State.Running}}' "${name}" 2>/dev/null || echo false)" == "true" ]]
}

# 检测本机 TCP 端口是否有进程在监听，$1=端口号（用于 MySQL/Redis 或 busybox 回退）
is_listening() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    [[ -n "$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)" ]]
  else
    docker run --rm busybox nc -z host.docker.internal "${port}" >/dev/null 2>&1
  fi
}

# 轮询等待 MySQL 可用：优先容器内 mysqladmin ping，其次仅检测端口
wait_mysql_ready() {
  log "等待 MySQL (:${MYSQL_PORT}) 就绪..."
  local i
  for ((i = 1; i <= 60; i++)); do  # 最多 60 次 × 2s ≈ 120s
    if container_is_running "${CONTAINER_MYSQL}"; then
      # -T 无 TTY；-uroot -proot 与 compose 中 MYSQL_ROOT_PASSWORD 一致
      if compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -proot --silent 2>/dev/null; then
        log "MySQL 已就绪 (容器 ${CONTAINER_MYSQL})"
        return 0
      fi
    elif is_listening "${MYSQL_PORT}"; then
      log "MySQL 端口 ${MYSQL_PORT} 已监听 (非 Docker 或容器名不同)"
      return 0
    fi
    sleep 2
  done
  err "MySQL 启动超时 (60s)。请查看: docker compose logs mysql"
  exit 1
}

# 轮询等待 Redis 可用：优先 redis-cli PING，其次仅检测端口
wait_redis_ready() {
  log "等待 Redis (:${REDIS_PORT}) 就绪..."
  local i
  for ((i = 1; i <= 30; i++)); do  # 最多 30s
    if container_is_running "${CONTAINER_REDIS}"; then
      if compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        log "Redis 已就绪 (容器 ${CONTAINER_REDIS})"
        return 0
      fi
    elif is_listening "${REDIS_PORT}"; then
      log "Redis 端口 ${REDIS_PORT} 已监听"
      return 0
    fi
    sleep 1
  done
  err "Redis 启动超时 (30s)。请查看: docker compose logs redis"
  exit 1
}

# 确保 Docker 中 mysql/redis 已启动并就绪
ensure_docker_infra() {
  if [[ "${SKIP_DOCKER:-}" == "1" ]]; then
    warn "已设置 SKIP_DOCKER=1，跳过 Docker 检查"
    if ! is_listening "${MYSQL_PORT}"; then
      warn "端口 ${MYSQL_PORT} 未监听，请确认本机 MySQL 已启动"
    fi
    return 0
  fi

  if [[ ! -f "${COMPOSE_FILE}" ]]; then
    err "未找到 ${COMPOSE_FILE}，无法启动 MySQL/Redis"
    exit 1
  fi

  check_docker_daemon

  local to_start=()  # 待启动的 compose 服务名列表
  container_is_running "${CONTAINER_MYSQL}" || to_start+=(mysql)
  container_is_running "${CONTAINER_REDIS}" || to_start+=(redis)

  if [[ ${#to_start[@]} -gt 0 ]]; then
    log "启动 Docker 容器: ${to_start[*]} ..."
    compose up -d "${to_start[@]}"  # 仅启动未运行的服务
  else
    log "Docker 容器 mysql / redis 已在运行"
  fi

  wait_mysql_ready
  wait_redis_ready
}

# 若 apps/api/.env 不存在，从 .env.example 复制（默认 DATABASE_URL=root:root）
ensure_api_env() {
  local env_file="${ROOT}/apps/api/.env"
  local example="${ROOT}/apps/api/.env.example"
  if [[ ! -f "${env_file}" && -f "${example}" ]]; then
    warn "复制 apps/api/.env.example -> apps/api/.env"
    cp "${example}" "${env_file}"
  fi
}

# 执行 Prisma 迁移；SKIP_MIGRATE=1 时跳过
run_db_migrate() {
  if [[ "${SKIP_MIGRATE:-}" == "1" ]]; then
    return 0
  fi
  log "执行数据库迁移 (prisma migrate deploy)..."
  if (cd "${ROOT}/apps/api" && pnpm exec prisma migrate deploy >>"${LOG_DIR}/migrate.log" 2>&1); then
    log "数据库迁移完成"
  else
    warn "迁移未成功，详见 ${LOG_DIR}/migrate.log（若库已迁移可忽略）"
  fi
}

# 写入演示账号 admin/admin123、C 端用户等；SKIP_SEED=1 时跳过
run_db_seed() {
  if [[ "${SKIP_SEED:-}" == "1" ]]; then
    return 0
  fi
  log "写入种子数据 (admin/admin123)..."
  if (cd "${ROOT}/apps/api" && pnpm prisma:seed >>"${LOG_DIR}/seed.log" 2>&1); then
    log "种子数据完成"
  else
    warn "种子数据失败，详见 ${LOG_DIR}/seed.log"
    warn "管理后台需种子账号方可登录，可手动: cd apps/api && pnpm prisma:seed"
  fi
}

# 打印 Docker 引擎与 compose 容器状态（供 ./dev.sh status / docker 子命令）
docker_status() {
  echo "--- Docker ---"
  if ! command -v docker >/dev/null 2>&1; then
    echo "未安装 docker"
    return
  fi
  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker 引擎未运行${NC} — 请启动 Docker Desktop"
    return
  fi
  echo -e "${GREEN}Docker 引擎运行中${NC}"
  if [[ -f "${COMPOSE_FILE}" ]]; then
    compose ps 2>/dev/null || true
  fi
  echo ""
}

# =============================================================================
# 应用进程（api / web / admin）
# =============================================================================

# 返回占用指定端口的 PID 列表，$1=端口
pids_on_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true
  else
    err "需要 lsof 以管理应用端口"
    exit 1
  fi
}

# 端口是否有进程监听
app_is_listening() {
  [[ -n "$(pids_on_port "$1")" ]]
}

# 强制结束占用端口的进程（启动前清理，实现重启）
kill_port() {
  local port=$1
  local pids
  pids="$(pids_on_port "$port")"
  if [[ -n "$pids" ]]; then
    warn "停止端口 ${port} 上的进程: $(echo "$pids" | tr '\n' ' ')"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1  # 等待端口释放
  fi
}

# 根据 .dev/<name>.pid 结束启动时记录的 shell 进程（辅助清理）
kill_pid_file() {
  local name=$1
  local f="${DEV_DIR}/${name}.pid"
  if [[ -f "$f" ]]; then
    local pid
    pid="$(cat "$f")"
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  fi
}

# 等待应用端口进入监听，$2=端口 $3=最长秒数（默认 45）
wait_app_port() {
  local port=$2 max="${3:-45}"
  local i
  for ((i = 1; i <= max; i++)); do
    if app_is_listening "$port"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# 启动单个应用：$1=名称 $2=端口 $3=启动命令 $4=访问地址 $5=最长等待秒数
start_one() {
  local name=$1 port=$2 cmd=$3 url=$4 max_wait="${5:-45}"

  log "[${name}] 端口 ${port} ..."

  if app_is_listening "$port"; then
    warn "[${name}] 已在运行，正在重启..."
  fi

  kill_port "$port"
  kill_pid_file "$name"

  # Web 重启前清理 Nuxt，避免 vite-node IPC socket ENOENT
  if [[ "$name" == "web" ]]; then
    cleanup_nuxt
    log "[web] 生成 Nuxt 类型与别名 (.nuxt)..."
    (cd "${ROOT}/apps/web" && bash scripts/prepare.sh) >>"${LOG_DIR}/web.log" 2>&1 || true
  fi

  # 后台启动；日志追加到 .dev/logs/<name>.log
  # 注意：不可写 exec TMPDIR=/tmp pnpm ...，bash 会把 TMPDIR=/tmp 当成可执行路径
  local start_env=""
  if [[ "$name" == "web" ]]; then
    start_env="export TMPDIR=/tmp TEMP=/tmp TMP=/tmp; "
  fi
  nohup bash -c "cd \"${ROOT}\" && ${start_env}exec ${cmd}" >>"${LOG_DIR}/${name}.log" 2>&1 &
  echo $! >"${DEV_DIR}/${name}.pid"  # 记录 nohup 的 shell PID

  if wait_app_port "$name" "$port" "$max_wait"; then
    log "[${name}] 就绪 -> ${url}"
  else
    err "[${name}] ${max_wait}s 内端口 ${port} 未就绪，日志: ${LOG_DIR}/${name}.log"
    tail -n 25 "${LOG_DIR}/${name}.log" 2>/dev/null || true
    return 1
  fi
}

# 清理 Nuxt 缓存与临时 socket（修复 connect ENOENT nuxt-vite-node-*.sock）
cleanup_nuxt() {
  log "清理 Nuxt 缓存 (.nuxt / .output)..."
  rm -rf "${ROOT}/apps/web/.nuxt" "${ROOT}/apps/web/.output"
  rm -rf "${ROOT}/apps/web/node_modules/.cache/nuxt" 2>/dev/null || true
  # 清理 vite-node IPC socket（Web 使用 TMPDIR=/tmp，避免 macOS 路径过长导致 chmod ENOENT）
  rm -rf /tmp/nuxt-vite-node-* 2>/dev/null || true
  if [[ -n "${TMPDIR:-}" && "${TMPDIR}" != "/tmp" ]]; then
    rm -rf "${TMPDIR}"/nuxt-vite-node-* 2>/dev/null || true
  fi
  # macOS 系统默认临时目录（/var/folders/.../T）中的残留
  if [[ "$(uname -s)" == "Darwin" ]]; then
    find /var/folders -maxdepth 5 -type d -name 'nuxt-vite-node-*' 2>/dev/null \
      | while read -r d; do rm -rf "$d"; done || true
  fi
  # 结束可能残留的 nuxt 子进程
  pkill -f "nuxt dev" 2>/dev/null || true
  sleep 1
}

# 停止三端 Node 进程（不停止 Docker）
stop_apps() {
  log "停止应用服务 (api / web / admin)..."
  kill_port "$API_PORT"
  kill_port "$WEB_PORT"
  kill_port "$ADMIN_PORT"
  kill_pid_file "api"
  kill_pid_file "web"
  kill_pid_file "admin"
  cleanup_nuxt
  log "应用已停止"
}

# 停止 compose 中的 mysql、redis 容器（./dev.sh stop --all 时调用）
stop_docker() {
  if [[ -f "${COMPOSE_FILE}" ]] && docker info >/dev/null 2>&1; then
    log "停止 Docker 容器 (mysql / redis)..."
    compose stop mysql redis 2>/dev/null || true
  fi
}

# 汇总 Docker + 三端应用状态
status_all() {
  docker_status
  printf "%-8s %-8s %-8s %s\n" "应用" "端口" "状态" "地址"
  check_app_status "API"   "$API_PORT"   "http://localhost:${API_PORT}/api/v1/health"
  check_app_status "Web"   "$WEB_PORT"   "http://localhost:${WEB_PORT}"
  check_app_status "Admin" "$ADMIN_PORT" "http://localhost:${ADMIN_PORT}"
  echo ""
  echo "日志: ${LOG_DIR}"
}

# 打印单行应用状态，$1=显示名 $2=端口 $3=URL
check_app_status() {
  local name=$1 port=$2 url=$3
  if app_is_listening "$port"; then
    printf "%-8s %-8s ${GREEN}运行中${NC}  %s\n" "$name" "$port" "$url"
  else
    printf "%-8s %-8s ${RED}未启动${NC}  %s\n" "$name" "$port" "$url"
  fi
}

# 完整启动流程：基础设施 → 依赖 → shared 编译 → 三端
start_all() {
  need_cmd pnpm   # Monorepo 包管理
  need_cmd lsof   # 端口占用检测

  ensure_docker_infra  # Docker + MySQL/Redis 就绪
  ensure_api_env       # 生成 .env
  run_db_migrate       # Prisma 迁移
  run_db_seed          # 演示账号 admin/admin123

  if [[ ! -d "${ROOT}/node_modules" ]]; then
    warn "未检测到 node_modules，正在 pnpm install ..."
    pnpm install
  fi

  log "编译 @simplemall/shared ..."
  pnpm --filter @simplemall/shared build  # API 运行时依赖编译后的 dist，非 .ts enum

  log "启动 SimpleMall 开发服务 (${ROOT})"
  echo ""

  # 名称  端口         启动命令                              就绪后访问地址                         最长等待(秒)
  start_one "api"   "$API_PORT"   "pnpm --filter @simplemall/api dev"   "http://localhost:${API_PORT}/api/v1/health" 60
  start_one "web"   "$WEB_PORT"   "pnpm --filter @simplemall/web dev" "http://localhost:${WEB_PORT}"                90
  start_one "admin" "$ADMIN_PORT" "pnpm --filter @simplemall/admin dev" "http://localhost:${ADMIN_PORT}"              45

  echo ""
  log "全部完成。日志: tail -f ${LOG_DIR}/api.log"
  log "停止应用: ./dev.sh stop | 停止应用+Docker: ./dev.sh stop --all"
}

# ---------- 命令行入口 ----------
ACTION="${1:-start}"  # 第一个参数：子命令，默认 start
EXTRA="${2:-}"        # 第二个参数：如 stop 的 --all，或 docker 的 up/down

case "$ACTION" in
  start|restart|up)  # 启动 / 重启（已在跑会先杀端口再起）
    start_all
    ;;
  stop|down)         # 停止应用；带 --all / -a 时额外停 Docker
    stop_apps
    if [[ "$EXTRA" == "--all" || "$EXTRA" == "-a" ]]; then
      stop_docker
    fi
    ;;
  status)            # 查看 Docker 与三端端口
    status_all
    ;;
  docker)            # 单独管理数据库容器
    check_docker_daemon
    case "${EXTRA:-status}" in
      status|ps)       # ./dev.sh docker 或 ./dev.sh docker status
        docker_status
        ;;
      up)              # ./dev.sh docker up
        compose up -d mysql redis
        wait_mysql_ready
        wait_redis_ready
        ;;
      down|stop)       # ./dev.sh docker down
        compose stop mysql redis
        ;;
      logs)            # ./dev.sh docker logs [mysql|redis]，服务名在 $3
        compose logs -f "${3:-mysql}"
        ;;
      *)
        echo "用法: $0 docker [status|up|down|logs [mysql|redis]]"
        ;;
    esac
    ;;
  *)                 # 未知子命令，打印帮助
    err "未知命令: $ACTION"
    echo ""
    echo "用法:"
    echo "  $0 [start|restart|stop|status|docker]"
    echo "  $0 stop --all              # 停止应用 + Docker mysql/redis"
    echo "  $0 docker [up|down|logs]   # 单独管理数据库容器"
    echo ""
    echo "环境变量:"
    echo "  SKIP_DOCKER=1 $0           # 使用本机 MySQL/Redis"
    echo "  SKIP_MIGRATE=1 $0          # 跳过数据库迁移"
    echo "  API_PORT=4001 $0           # 自定义 API 端口"
    exit 1
    ;;
esac
