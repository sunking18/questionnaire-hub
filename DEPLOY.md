# 腾讯云轻量应用服务器部署指南

## 架构总览

```
腾讯云轻量应用服务器 (建议: 2核4G, CentOS 7/Ubuntu 22.04)

┌──────────────────────────────────────────────────┐
│                    Nginx (:80/443)                │
│        静态文件 /           API 反向代理            │
│     /usr/share/nginx/html → :3001/api            │
├──────────────────────────────────────────────────┤
│  Node.js API Server (PM2 守护进程)                │
│  /opt/questionnaire-hub/server                   │
│  Port: 3001                                      │
├──────────────────────────────────────────────────┤
│  PostgreSQL 16                                   │
│  Port: 5432                                      │
│  Database: questionnaire_hub                      │
└──────────────────────────────────────────────────┘
```

---

## 一、服务器初始化

### 1. 购买服务器
- 腾讯云控制台 → 轻量应用服务器 → 新建
- 推荐配置: **2核4G** / 系统盘 60GB
- 镜像: **Ubuntu 22.04 LTS** 或 **CentOS 7.9**
- 地域: 根据目标用户选择

### 2. 安全组配置
在腾讯云控制台 → 轻量应用服务器 → 防火墙，开放端口:
| 端口 | 用途 |
|------|------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |
| 3001 | API (可选，通过 Nginx 代理后无需直接暴露) |

### 3. SSH 登录
```bash
ssh root@<你的服务器IP>
```

---

## 二、安装基础环境

### Ubuntu 22.04 执行:

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PostgreSQL 16
apt install -y postgresql postgresql-contrib

# 安装 Nginx
apt install -y nginx

# 安装 PM2 (Node.js 进程管理)
npm install -g pm2

# 安装 Git
apt install -y git

# 验证
node -v    # v20.x
npm -v     # 10.x
psql --version
nginx -v
```

### CentOS 7 执行:

```bash
# 更新系统
yum update -y

# 安装 Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 安装 PostgreSQL 16
yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
yum install -y postgresql16 postgresql16-server
/usr/pgsql-16/bin/postgresql-16-setup initdb
systemctl enable postgresql-16
systemctl start postgresql-16

# 安装 Nginx
yum install -y nginx

# 安装 PM2
npm install -g pm2

# 安装 Git
yum install -y git
```

---

## 三、配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 psql 中执行:
CREATE DATABASE questionnaire_hub;
CREATE USER qhub WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE questionnaire_hub TO qhub;

# PostgreSQL 15+ 需要额外执行:
\c questionnaire_hub
GRANT ALL ON SCHEMA public TO qhub;

\q
```

### 配置远程访问（可选，仅开发时需要）
```bash
# 编辑 postgresql.conf
# Ubuntu: /etc/postgresql/16/main/postgresql.conf
# CentOS: /var/lib/pgsql/16/data/postgresql.conf

# 修改:
listen_addresses = 'localhost'  # 保持 localhost，通过 SSH 隧道或本地访问

# 重启
systemctl restart postgresql
```

---

## 四、部署项目代码

### 方法1: Git 部署（推荐）

在本地将代码推送到 GitHub，然后在服务器上拉取:

```bash
# 服务器上
cd /opt
git clone https://github.com/你的用户名/questionnaire-hub.git
cd questionnaire-hub
```

### 方法2: SCP 上传

```bash
# 本地执行
scp -r ./questionnaire-hub root@<服务器IP>:/opt/
```

---

## 五、配置并启动服务

### 1. 配置环境变量

```bash
cd /opt/questionnaire-hub/server

# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL="postgresql://qhub:your_secure_password_here@localhost:5432/questionnaire_hub?schema=public"
JWT_SECRET="生成一个随机字符串-至少32位"
PORT=3001
NODE_ENV=production
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4o"
CLIENT_URL="http://你的域名或IP"
EOF

# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 把输出填入上面的 JWT_SECRET
```

### 2. 构建后端

```bash
cd /opt/questionnaire-hub/server

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 执行数据库迁移
npx prisma db push

# 导入种子数据
npx prisma db seed

# 构建 TypeScript
npm run build
```

### 3. 构建前端

```bash
cd /opt/questionnaire-hub/client

# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建产物在 client/dist/ 目录
```

### 4. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/questionnaire-hub << 'EOF'
server {
    listen 80;
    server_name _;  # 替换为你的域名，如 example.com

    # 前端静态文件
    root /opt/questionnaire-hub/client/dist;
    index index.html;

    # SPA 路由 - 所有非 API 请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/questionnaire-hub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # 删除默认站点

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 5. 使用 PM2 启动后端

```bash
cd /opt/questionnaire-hub/server

# 启动
pm2 start dist/index.js --name questionnaire-api

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs questionnaire-api
```

---

## 六、配置 HTTPS（推荐）

使用 Let's Encrypt 免费证书:

```bash
# 安装 certbot
apt install -y certbot python3-certbot-nginx  # Ubuntu
# 或
yum install -y certbot python3-certbot-nginx  # CentOS

# 先确保域名已解析到服务器
# 然后执行:
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

---

## 七、验证部署

```bash
# 检查服务状态
systemctl status nginx
systemctl status postgresql
pm2 status

# 测试 API
curl http://localhost:3001/api/health

# 测试前端
curl http://localhost/

# 检查日志
pm2 logs questionnaire-api --lines 20
journalctl -u nginx -f
```

---

## 八、日常维护

### 更新代码
```bash
cd /opt/questionnaire-hub
git pull

# 更新后端
cd server && npm install && npx prisma generate && npm run build
pm2 restart questionnaire-api

# 更新前端
cd ../client && npm install && npm run build
```

### 数据库备份
```bash
# 创建备份脚本
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
pg_dump -U qhub questionnaire_hub | gzip > "$BACKUP_DIR/db_$(date +%Y%m%d_%H%M).sql.gz"
# 保留最近7天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh

# 添加定时任务（每天凌晨2点备份）
echo "0 2 * * * /opt/backup-db.sh" | crontab -
```

### 查看日志
```bash
# API 日志
pm2 logs questionnaire-api

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 九、成本估算

| 项目 | 配置 | 月费用 |
|------|------|--------|
| 轻量应用服务器 | 2核4G / 60GB | ~¥68 |
| 流量包 | 500GB/月 | 含在套餐内 |
| 域名 | .com | ~¥60/年 |
| SSL证书 | Let's Encrypt | 免费 |
| **合计** | | **~¥73/月** |

---

## 十、默认账号

部署完成后，访问 `http://你的IP` 即可看到登录页面。

| 邮箱 | 密码 | 角色 |
|------|------|------|
| researcher@example.com | password123 | 管理员 |

⚠️ **首次登录后请立即修改密码！**
