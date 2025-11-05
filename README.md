# Multilogin 自动化工具

自动化启动 Multilogin 指纹浏览器并访问指定页面。

## 使用方法

### 默认模式（模拟Facebook安卓App内置浏览器打开）

```bash
node multilogin_auto.js
```

运行后会提示：
```
请输入任务链接：
> 
```

粘贴你的任务链接，按 Enter 即可。

### 普通浏览器模式（模拟Chrome 浏览器打开）

```bash
node multilogin_auto.js --no-fb-ua
```

同样需要输入任务链接。

**浏览器会保持打开状态，按 `Ctrl+C` 可以停止脚本。**


