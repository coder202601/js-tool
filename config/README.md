# 配置说明

## 1. 配置文件

### proxies.json - 代理配置
```json
[
  {
    "host": "代理IP地址",
    "port": 端口号,
    "username": "用户名（没有就留空）",
    "password": "密码（没有就留空）"
  }
]
```

### facebook_urls.txt - Facebook URL列表
每行一个URL，支持注释（#开头）
```
https://www.facebook.com/ads/...
https://www.facebook.com/ads/...
# 这是注释
```

## 2. 执行命令

```bash
node multilogin_auto.js
```

## 3. 说明

- 代理会自动轮询使用
- URL会从文件中随机选择一个
- 如果URL文件为空，会随机生成URL

