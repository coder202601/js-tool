# 使用说明

## 第一步：配置代理

编辑 `config/proxies.json`：

```json
[
  {
    "host": "123.456.78.90",
    "port": "8080",
    "username": "your_username",
    "password": "your_password"
  }
]
```

- 可以配置多个代理，程序会自动轮换
- 没有用户名密码就填空字符串 `""`

## 第二步：准备URL

### 普通Android浏览器

编辑 `config/facebook_urls.txt`，每行一个URL：

```
https://www.facebook.com/ads/library/?id=123456
https://www.facebook.com/ads/library/?id=789012
# 这是注释
```

### Facebook App内置浏览器

编辑 `config/internal_facebook_urls.txt`，每行一个URL：

```
https://www.facebook.com/ads/library/?id=123456
https://www.facebook.com/ads/library/?id=789012
# 这是注释
```

⚠️ **URL用完会自动删除，记得备份！**

## 第三步：运行

### 普通Android浏览器
```bash
node multilogin_auto.js
```
- 读取 `facebook_urls.txt`

### Facebook App内置浏览器
```bash
node multilogin_auto.js --fb-ua
```
- 读取 `internal_facebook_urls.txt`
- 模拟Facebook App的JavaScript环境
