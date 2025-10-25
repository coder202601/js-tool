const { chromium } = require('playwright');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FacebookURLGenerator = require('./facebook-url-generator.js');

// Multilogin X API 配置
const MLX_BASE = 'https://api.multilogin.com';
const MLX_LAUNCHER = 'https://launcher.mlx.yt:45001';

// 你的 Multilogin X 账户信息
const USERNAME = 'ccanxiong3@gmail.com'; // TODO: 填写你的邮箱
const PASSWORD = 'Aa123123..'; // TODO: 填写你的密码（原始密码，不是MD5）

// 配置目录
const CONFIG_DIR = path.join(__dirname, 'config');

// SOCKS5 代理配置文件路径
const PROXY_CONFIG_FILE = path.join(CONFIG_DIR, 'proxies.json');

// 代理索引持久化文件（保存到临时目录，避免权限问题）
const PROXY_INDEX_FILE = path.join(os.tmpdir(), 'multilogin_proxy_index.txt');

/**
 * 从文件加载代理配置
 */
function loadProxies() {
  try {
    if (fs.existsSync(PROXY_CONFIG_FILE)) {
      const data = fs.readFileSync(PROXY_CONFIG_FILE, 'utf-8');
      const proxies = JSON.parse(data);
      if (Array.isArray(proxies) && proxies.length > 0) {
        console.log(`✅ 成功加载 ${proxies.length} 个代理配置`);
        return proxies;
      }
    }
    throw new Error('代理配置文件不存在或格式错误');
  } catch (error) {
    console.error(`❌ 加载代理配置失败: ${error.message}`);
    process.exit(1);
  }
}

// 加载代理列表
const PROXIES = loadProxies();

let authToken = null;

/**
 * 读取上次使用的代理索引
 */
function loadProxyIndex() {
  try {
    if (fs.existsSync(PROXY_INDEX_FILE)) {
      const index = parseInt(fs.readFileSync(PROXY_INDEX_FILE, 'utf-8').trim());
      if (!isNaN(index) && index >= 0 && index < PROXIES.length) {
        return index;
      }
    }
  } catch (error) {
    console.warn('读取代理索引失败，使用默认值0');
  }
  return 0;
}

/**
 * 保存当前代理索引
 */
function saveProxyIndex(index) {
  try {
    fs.writeFileSync(PROXY_INDEX_FILE, index.toString(), 'utf-8');
  } catch (error) {
    console.error(`⚠️  保存代理索引失败 (${PROXY_INDEX_FILE}): ${error.message}`);
  }
}

/**
 * 获取下一个代理（轮询方式）
 */
function getNextProxy() {
  const currentIndex = loadProxyIndex();
  const proxy = PROXIES[currentIndex];
  const nextIndex = (currentIndex + 1) % PROXIES.length;
  saveProxyIndex(nextIndex);
  return proxy;
}

/**
 * 发送 HTTPS 请求
 */
function httpsRequest(url, method, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    console.log(`[DEBUG] 请求: ${method} ${url}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`[DEBUG] 响应码: ${res.statusCode}`);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (error) {
          reject(new Error(`解析响应失败: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 登录并获取 Bearer Token
 */
async function signIn() {
  console.log('\n[1/5] 登录到 Multilogin X...');

  const passwordHash = crypto.createHash('md5').update(PASSWORD).digest('hex');

  const response = await httpsRequest(
    `${MLX_BASE}/user/signin`,
    'POST',
    {
      email: USERNAME,
      password: passwordHash
    }
  );

  if (response.statusCode === 200 && response.data.data && response.data.data.token) {
    authToken = response.data.data.token;
    console.log(`      Token 获取成功`);
    return authToken;
  } else {
    throw new Error('登录失败: ' + JSON.stringify(response.data));
  }
}

/**
 * 创建快速配置文件（使用 /v3/profile/quick 端点）
 */
async function createQuickProfile() {
  const proxy = getNextProxy();
  console.log(`\n[3/5] 创建快速配置文件`);
  const proxyAuth = proxy.username ? `${proxy.username}@` : '';
  console.log(`      代理: socks5://${proxyAuth}${proxy.host}:${proxy.port}`);

  const profileData = {
    browser_type: 'mimic',
    os_type: 'android',
    parameters: {
      proxy: {
        type: 'socks5',
        host: proxy.host,
        port: parseInt(proxy.port),
        username: proxy.username || '',
        password: proxy.password || '',
        save_traffic: false
      },
      fingerprint: {},
      flags: {
        audio_masking: 'mask',
        canvas_noise: 'natural',
        fonts_masking: 'mask',
        geolocation_masking: 'mask',
        geolocation_popup: 'prompt',
        graphics_masking: 'mask',
        graphics_noise: 'mask',
        localization_masking: 'mask',
        media_devices_masking: 'mask',
        navigator_masking: 'mask',
        ports_masking: 'mask',
        proxy_masking: 'custom',  // 使用 proxy 时需要这个
        screen_masking: 'mask',
        timezone_masking: 'mask',
        webrtc_masking: 'mask'
      }
    },
    automation: 'playwright',  // 添加 automation 类型
    is_headless: false
  };

  const response = await httpsRequest(
    `${MLX_LAUNCHER}/api/v3/profile/quick`,
    'POST',
    profileData,
    { 'Authorization': `Bearer ${authToken}` }
  );

  if (response.statusCode === 200 && response.data.data) {
    const profileId = response.data.data.id;
    const wsEndpoint = `http://127.0.0.1:${response.data.data.port}`;
    console.log(`      配置文件 ID: ${profileId}`);
    console.log(`      WebSocket 端点: ${wsEndpoint}`);
    return { profileId, wsEndpoint };
  } else {
    throw new Error('创建配置文件失败: ' + JSON.stringify(response.data));
  }
}

/**
 * 使用 Playwright 连接浏览器
 */
async function openBrowserWithURL(wsEndpoint, generator) {
  console.log(`\n[4/5] 连接到浏览器`);

  const browser = await chromium.connectOverCDP(wsEndpoint);
  const contexts = browser.contexts();


  // 强制创建新页面，不复用可能不稳定的启动页面
  let page;
  if (contexts.length > 0) {
    page = await contexts[0].newPage();
  } else {
    const context = await browser.newContext();
    page = await context.newPage();
  }

  // 等待页面初始化完成（避免 about:blank 导航冲突）
  await page.waitForLoadState('load').catch(() => { });
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`\n[5/5] 正在检查网络环境...`);

  try {
    // 先打开状态检查页面
    await page.goto('http://status.mazubaoyou.org/', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });

    // 等待关键元素加载完成（而不是固定等待时间）
    await page.waitForSelector('.passclass', { timeout: 30000 });

    // 再等待一下确保所有内容都加载完成
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('   网络未完全空闲，但继续检查...');
    });

    // 检查是否有两个 "passclass pass"
    const passclassCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('.passclass.pass');
      return elements.length;
    });

    if (passclassCount === 2) {
      console.log(`✅ 网络环境检查通过（找到 ${passclassCount} 个通过标记）`);
      
      // 【关键】只有在网络环境检查通过后，才读取并删除URL
      console.log(`\n正在读取目标URL...`);
      const result = generator.generateURL();
      const url = result.url;
      console.log(`      数据来源: ${result.metadata.source}`);
      console.log(`      URL: ${url.substring(0, 100)}...`);
      
      console.log(`\n正在打开目标页面（新窗口）...`);

      // 在新窗口中打开Facebook URL
      const newPage = await contexts[0].newPage();
      await newPage.goto(url, {
        referer: 'http://m.facebook.com',
        waitUntil: 'domcontentloaded',
        timeout: 90000
      });

      console.log(`\n✅ 成功打开页面！`);
      console.log(`   浏览器窗口将保持打开状态，按 Ctrl+C 停止脚本。`);

      await new Promise(() => { });
    } else {
      console.log(`❌ 网络环境检查失败（只找到 ${passclassCount} 个通过标记，需要 2 个）`);
      console.log(`   正在关闭浏览器...`);
      await browser.close();
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ 检查过程出错: ${error.message}`);
    console.log(`   正在关闭浏览器...`);
    await browser.close();
    process.exit(1);
  }
}
/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(80));
  console.log('Multilogin X 自动化脚本');
  console.log('='.repeat(80));

  if (!USERNAME || !PASSWORD) {
    console.error('\n❌ 错误: 请先填写 USERNAME 和 PASSWORD');
    process.exit(1);
  }

  try {
    // 1. 登录
    await signIn();

    // 2. 创建 URL 生成器（但不立即读取URL）
    const generator = new FacebookURLGenerator({ mode: 'file' });
    console.log(`\n[2/5] URL生成器已准备（将在网络检查通过后读取URL）`);

    // 3. 创建并启动快速配置文件（quick profile 创建后自动启动）
    const { profileId, wsEndpoint } = await createQuickProfile();

    // 等待浏览器完全启动
    // console.log(`\n[3/5] 等待浏览器启动...`);
    // await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. 打开浏览器并访问 URL（URL将在网络检查通过后才读取和删除）
    await openBrowserWithURL(wsEndpoint, generator);

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();