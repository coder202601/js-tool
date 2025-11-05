const { chromium } = require('playwright');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const readline = require('readline');
const { generateFacebookUserAgent } = require('./fb-useragent.js');

// 解析命令行参数
const useFacebookUA = !process.argv.includes('--no-fb-ua');

// Multilogin X API 配置
const MLX_BASE = 'https://api.multilogin.com';
const MLX_LAUNCHER = 'https://launcher.mlx.yt:45001';

// 你的 Multilogin X 账户信息
const USERNAME = 'ccanxiong3@gmail.com';
const PASSWORD = 'Aa123123..';

let authToken = null;

/**
 * 读取用户输入
 */
function getUserInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
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
 * 获取任务配置（代理和跳转URL）
 */
async function fetchTask(taskApiUrl) {
  console.log('\n[1/5] 获取任务配置...');
  
  const response = await httpsRequest(taskApiUrl, 'GET');
  
  if (response.statusCode !== 200 || !response.data.success) {
    throw new Error('获取任务失败: ' + JSON.stringify(response.data));
  }
  
  const { proxy, redirect_url } = response.data;
  
  console.log(`      代理服务器: ${proxy.proxy_host}:${proxy.port}`);
  console.log(`      代理用户: ${proxy.customer}`);
  console.log(`      跳转URL: ${redirect_url.substring(0, 80)}...`);
  
  return { proxy, redirectUrl: redirect_url };
}

/**
 * 登录并获取 Bearer Token
 */
async function signIn() {
  console.log('\n[2/5] 登录到 Multilogin X...');

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
async function createQuickProfile(proxy) {
  console.log(`\n[3/5] 创建快速配置文件`);
  console.log(`      代理: socks5://${proxy.customer}@${proxy.proxy_host}:${proxy.port}`);

  // 根据参数决定是否生成自定义UA
  let customUA = null;
  let navigatorData = {};
  if (useFacebookUA) {
    const uaResult = generateFacebookUserAgent();
    customUA = uaResult.userAgent;
    navigatorData = {
      user_agent: customUA,
      hardware_concurrency: uaResult.metadata.navigator.hardwareConcurrency,
      platform: uaResult.metadata.navigator.platform
    };
    console.log(`      自定义UA: ${customUA.substring(0, 80)}...`);
    console.log(`      设备: ${uaResult.metadata.device.name} (${uaResult.metadata.device.model})`);
    console.log(`      CPU核心数: ${uaResult.metadata.navigator.hardwareConcurrency}`);
    console.log(`      Platform: ${uaResult.metadata.navigator.platform}`);
  }

  const profileData = {
    browser_type: 'mimic',
    os_type: 'android',
    parameters: {
      proxy: {
        type: 'socks5',
        host: proxy.proxy_host,
        port: parseInt(proxy.port),
        username: proxy.customer,
        password: proxy.password,
        save_traffic: false
      },
      fingerprint: useFacebookUA ? {
        navigator: navigatorData
      } : {},
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
        navigator_masking: useFacebookUA ? 'custom' : 'mask',
        ports_masking: 'mask',
        proxy_masking: 'custom',
        screen_masking: 'mask',
        timezone_masking: 'mask',
        webrtc_masking: 'mask'
      }
    },
    automation: 'playwright',
    is_headless: false
  };

  console.log('\n[DEBUG] 完整的 profileData:');
  console.log(JSON.stringify(profileData, null, 2));

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
async function openBrowserWithURL(wsEndpoint, redirectUrl) {
  console.log(`\n[4/5] 连接到浏览器`);

  const browser = await chromium.connectOverCDP(wsEndpoint);
  const contexts = browser.contexts();

  // 强制创建新页面
  let page;
  if (contexts.length > 0) {
    page = await contexts[0].newPage();
  } else {
    const context = await browser.newContext();
    page = await context.newPage();
  }

  // 等待页面初始化完成
  await page.waitForLoadState('load').catch(() => { });
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`\n[5/5] 正在检查网络环境...`);

  try {
    // 先打开状态检查页面
    await page.goto('http://status.mazubaoyou.org/', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });

    // 等待关键元素加载完成
    await page.waitForSelector('.passclass', { timeout: 30000 });

    // 等待网络空闲
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
      
      console.log(`\n正在打开目标页面（新窗口）...`);
      console.log(`      URL: ${redirectUrl.substring(0, 100)}...`);

      // 在新窗口中打开目标URL
      const newPage = await contexts[0].newPage();
      await newPage.goto(redirectUrl, {
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
  console.log(useFacebookUA ? 'Multilogin X 自动化脚本 [Facebook UA 模式]' : 'Multilogin X 自动化脚本');
  console.log('='.repeat(80));

  if (!USERNAME || !PASSWORD) {
    console.error('\n❌ 错误: 请先填写 USERNAME 和 PASSWORD');
    process.exit(1);
  }

  try {
    // 0. 获取用户输入的任务链接
    console.log('\n请输入任务链接：');
    const taskApiUrl = await getUserInput('> ');
    
    if (!taskApiUrl) {
      throw new Error('任务链接不能为空');
    }

    // 1. 获取任务配置
    const { proxy, redirectUrl } = await fetchTask(taskApiUrl);

    // 2. 登录
    await signIn();

    // 3. 创建并启动快速配置文件
    const { profileId, wsEndpoint } = await createQuickProfile(proxy);

    // 4. 打开浏览器并访问 URL
    await openBrowserWithURL(wsEndpoint, redirectUrl);

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

main();