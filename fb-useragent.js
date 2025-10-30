const crypto = require('crypto');

// ============================================
// 真实设备型号池（基于 2025 年市场数据）
// ============================================
const DEVICE_MODELS = [
  // Samsung Galaxy S25 系列 (2025 最新)
  { model: 'SM-S931U', name: 'Galaxy S25', weight: 0.08, androidVersions: [16, 15], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S936U', name: 'Galaxy S25+', weight: 0.06, androidVersions: [16, 15], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S938U', name: 'Galaxy S25 Ultra', weight: 0.07, androidVersions: [16, 15], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S938B', name: 'Galaxy S25 Ultra', weight: 0.05, androidVersions: [16, 15], cores: 8, cpuArch: 'aarch64' },
  
  // Samsung Galaxy S24 系列
  { model: 'SM-S921U', name: 'Galaxy S24', weight: 0.10, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S926U', name: 'Galaxy S24+', weight: 0.08, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S928U', name: 'Galaxy S24 Ultra', weight: 0.09, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S926B', name: 'Galaxy S24+ Global', weight: 0.07, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  
  // Samsung Galaxy S23 系列
  { model: 'SM-S911U', name: 'Galaxy S23', weight: 0.08, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S916U', name: 'Galaxy S23+', weight: 0.05, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-S918U', name: 'Galaxy S23 Ultra', weight: 0.06, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  
  // Samsung Galaxy S21/S22 系列
  { model: 'SM-S721W', name: 'Galaxy S21 FE', weight: 0.10, androidVersions: [15, 14, 13], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-G991U', name: 'Galaxy S21 5G', weight: 0.12, androidVersions: [15, 14, 13], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-G996U', name: 'Galaxy S21+', weight: 0.05, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  
  // Samsung Galaxy S20 系列
  { model: 'SM-G981B', name: 'Galaxy S20', weight: 0.06, androidVersions: [14, 13, 12], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-G986U', name: 'Galaxy S20+', weight: 0.04, androidVersions: [14, 13], cores: 8, cpuArch: 'aarch64' },
  
  // Samsung Galaxy A 系列（中端市场）
  { model: 'SM-A326U', name: 'Galaxy A32 5G', weight: 0.07, androidVersions: [14, 13, 12], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-A525F', name: 'Galaxy A52 5G', weight: 0.05, androidVersions: [14, 13], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-A546U', name: 'Galaxy A54', weight: 0.06, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-A736U', name: 'Galaxy A73', weight: 0.04, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-A025A', name: 'Galaxy A02', weight: 0.04, androidVersions: [12, 11], cores: 4, cpuArch: 'aarch64' },
  
  // Samsung 旧设备
  { model: 'SM-G960U1', name: 'Galaxy S9', weight: 0.03, androidVersions: [10], cores: 8, cpuArch: 'aarch64' },
  { model: 'SM-G973U', name: 'Galaxy S10', weight: 0.04, androidVersions: [12, 11], cores: 8, cpuArch: 'aarch64' },
  
  // Motorola
  { model: 'moto g stylus 5G - 2024', name: 'Moto G Stylus 5G', weight: 0.07, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'moto g play - 2024', name: 'Moto G Play', weight: 0.05, androidVersions: [14, 13], cores: 4, cpuArch: 'aarch64' },
  { model: 'moto g power - 2024', name: 'Moto G Power', weight: 0.04, androidVersions: [14], cores: 8, cpuArch: 'aarch64' },
  { model: 'motorola edge 2024', name: 'Motorola Edge', weight: 0.03, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  
  // Xiaomi/Redmi
  { model: '2201117SG', name: 'Redmi Note 11', weight: 0.04, androidVersions: [13, 12], cores: 8, cpuArch: 'aarch64' },
  { model: '2201116SG', name: 'Redmi Note 11 Pro', weight: 0.03, androidVersions: [14, 13], cores: 8, cpuArch: 'aarch64' },
  { model: '2211133G', name: 'Redmi Note 12', weight: 0.04, androidVersions: [14, 13], cores: 8, cpuArch: 'aarch64' },
  { model: '23049RAD8G', name: 'Redmi Note 13 Pro', weight: 0.03, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  
  // Google Pixel
  { model: 'Pixel 8', name: 'Google Pixel 8', weight: 0.04, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'Pixel 8 Pro', name: 'Google Pixel 8 Pro', weight: 0.03, androidVersions: [16, 15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'Pixel 9', name: 'Google Pixel 9', weight: 0.05, androidVersions: [16, 15], cores: 8, cpuArch: 'aarch64' },
  { model: 'Pixel 7', name: 'Google Pixel 7', weight: 0.03, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  
  // OnePlus
  { model: 'CPH2581', name: 'OnePlus 12', weight: 0.04, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'CPH2525', name: 'OnePlus 11', weight: 0.03, androidVersions: [15, 14], cores: 8, cpuArch: 'aarch64' },
  { model: 'CPH2449', name: 'OnePlus Nord N30', weight: 0.03, androidVersions: [14, 13], cores: 8, cpuArch: 'aarch64' },
  
  // TCL / Generic Tablets
  { model: 'T704V', name: 'TCL Tab', weight: 0.02, androidVersions: [15, 14], cores: 4, cpuArch: 'aarch64' },
  { model: 'T614D', name: 'Generic Tablet', weight: 0.02, androidVersions: [14, 13], cores: 4, cpuArch: 'aarch64' },
  { model: 'T616D', name: 'Budget Tablet', weight: 0.02, androidVersions: [14], cores: 4, cpuArch: 'aarch64' }
];

// ============================================
// Facebook 应用版本分布（2025年最新）
// ============================================
const FB_VERSIONS = [
  // 2025年10月 - 最新版本
  { version: '536.1.0.58.77', weight: 0.18, chromeVersions: ['141.0.7390.123', '141.0.7390.119'] },
  { version: '536.0.0.46.77', weight: 0.25, chromeVersions: ['141.0.7390.119', '141.0.7390.97'] },
  { version: '535.0.0.49.72', weight: 0.20, chromeVersions: ['141.0.7390.97', '141.0.7390.93'] },
  { version: '534.0.0.56.76', weight: 0.15, chromeVersions: ['141.0.7390.62', '141.0.7390.70'] },
  { version: '533.0.0.49.79', weight: 0.10, chromeVersions: ['141.0.7390.44', '141.0.7390.62'] },
  { version: '531.0.0.47.70', weight: 0.07, chromeVersions: ['141.0.7390.44'] },
  { version: '530.0.0.48.74', weight: 0.05, chromeVersions: ['141.0.7390.44'] }
];

// ============================================
// Android 版本与 Build ID 配置（2025年真实数据）
// ============================================
const ANDROID_CONFIGS = {
  16: {
    weight: 0.12,
    buildPrefixes: ['BP2A', 'BP1A'],
    buildExamples: [
      { pattern: 'BP2A.250605.031', suffixes: ['A1', 'A2', 'A3', 'B1'] },
      { pattern: 'BP2A.241105.004', suffixes: ['A1', 'A2'] },
      { pattern: 'BP1A.241205.007', suffixes: ['A1', 'A2'] }
    ]
  },
  15: {
    weight: 0.32,
    buildPrefixes: ['AP3A', 'AP2A', 'AP1A'],
    buildExamples: [
      { pattern: 'AP3A.240905.015', suffixes: ['A1', 'A2', 'A3'] },
      { pattern: 'AP2A.240805.005', suffixes: ['A1', 'A2'] },
      { pattern: 'AP1A.240505.004', suffixes: ['A1'] }
    ]
  },
  14: {
    weight: 0.28,
    buildPrefixes: ['UP1A', 'U1TFS', 'UKQ1'],
    buildExamples: [
      { pattern: 'UP1A.231005.007', suffixes: [] },
      { pattern: 'U1TFS34.100-35-14-1', suffixes: ['2', '4', '6'] },
      { pattern: 'UKQ1.230917.001', suffixes: [] }
    ]
  },
  13: {
    weight: 0.18,
    buildPrefixes: ['TP1A', 'TKQ1', 'TQ3A'],
    buildExamples: [
      { pattern: 'TP1A.220624.014', suffixes: [] },
      { pattern: 'TKQ1.221114.001', suffixes: [] },
      { pattern: 'TQ3A.230805.001', suffixes: [] }
    ]
  },
  12: {
    weight: 0.08,
    buildPrefixes: ['SP1A', 'SKQ1', 'SQ3A'],
    buildExamples: [
      { pattern: 'SP1A.210812.016', suffixes: [] },
      { pattern: 'SKQ1.211006.001', suffixes: [] }
    ]
  },
  11: {
    weight: 0.02,
    buildPrefixes: ['RP1A', 'RKQ1'],
    buildExamples: [
      { pattern: 'RP1A.200720.012', suffixes: [] },
      { pattern: 'RKQ1.200826.002', suffixes: [] }
    ]
  },
  10: {
    weight: 0.01,
    buildPrefixes: ['QP1A', 'QKQ1'],
    buildExamples: [
      { pattern: 'QP1A.190711.020', suffixes: [] },
      { pattern: 'QKQ1.190910.002', suffixes: [] }
    ]
  }
};

// Motorola 特殊 Build ID 格式
const MOTOROLA_BUILD_PATTERNS = [
  'V1UB35H.97-51',
  'U1TFS34.100-35-14-1-4',
  'S1RCS32.41-20-7-4',
  'T1TES33.73-22-3'
];

// ============================================
// 辅助函数
// ============================================

// 加权随机选择
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

// 随机选择数组元素
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 生成 Build ID
function generateBuildId(androidVersion, deviceModel) {
  // Motorola 设备使用特殊格式
  if (deviceModel.toLowerCase().includes('moto')) {
    return randomChoice(MOTOROLA_BUILD_PATTERNS);
  }
  
  const config = ANDROID_CONFIGS[androidVersion];
  if (!config) return 'UNKNOWN.BUILD.ID';
  
  const buildExample = randomChoice(config.buildExamples);
  
  if (buildExample.suffixes && buildExample.suffixes.length > 0) {
    const suffix = randomChoice(buildExample.suffixes);
    return `${buildExample.pattern}.${suffix}`;
  }
  
  return buildExample.pattern;
}

// ============================================
// 主生成函数
// ============================================
function generateFacebookUserAgent() {
  // 1. 选择设备
  const device = weightedRandom(DEVICE_MODELS);
  
  // 2. 选择该设备支持的 Android 版本
  const supportedAndroidVersions = device.androidVersions.filter(
    v => ANDROID_CONFIGS[v]
  );
  const androidVersion = randomChoice(supportedAndroidVersions);
  
  // 3. 生成 Build ID
  const buildId = generateBuildId(androidVersion, device.model);
  
  // 4. 选择 Facebook 版本
  const fbVersion = weightedRandom(FB_VERSIONS);
  
  // 5. 选择对应的 Chrome 版本
  const chromeVersion = randomChoice(fbVersion.chromeVersions);
  
  // 6. 决定是否包含 IABMV（约 80% 包含）
  const hasIABMV = Math.random() < 0.80;
  const iabmvPart = hasIABMV ? 'IABMV/1;' : '';
  
  // 7. 决定是否包含 FBNV（约 5% 包含）
  const hasFBNV = Math.random() < 0.05;
  const fbnvPart = hasFBNV ? ' FBNV/500' : '';
  
  // 8. 构建 User-Agent
  const userAgent = `Mozilla/5.0 (Linux; Android ${androidVersion}; ${device.model} Build/${buildId}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${chromeVersion} Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/${fbVersion.version};${iabmvPart}]${fbnvPart}`;
  
  // 9. 生成 platform 字符串（根据 CPU 架构）
  const platform = `Linux ${device.cpuArch}`;
  
  return {
    userAgent,
    metadata: {
      device: {
        model: device.model,
        name: device.name,
        cores: device.cores,
        cpuArch: device.cpuArch
      },
      android: {
        version: androidVersion,
        buildId: buildId
      },
      facebook: {
        version: fbVersion.version
      },
      chrome: {
        version: chromeVersion
      },
      flags: {
        hasIABMV,
        hasFBNV
      },
      navigator: {
        hardwareConcurrency: device.cores,
        platform: platform
      }
    }
  };
}

// ============================================
// 批量生成函数（可选）
// ============================================
function generateMultipleUserAgents(count = 1) {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    results.push(generateFacebookUserAgent());
  }
  
  return results;
}

// ============================================
// 命令行执行
// ============================================
if (require.main === module) {
  // 检查命令行参数
  const args = process.argv.slice(2);
  const count = args.length > 0 ? parseInt(args[0]) : 1;
  
  if (isNaN(count) || count < 1) {
    console.error('❌ 错误：请提供有效的生成数量（大于0的整数）');
    console.log('用法: node fb-ua-generator.js [数量]');
    console.log('示例: node fb-ua-generator.js 5');
    process.exit(1);
  }
  
  console.log(`🚀 Facebook Android App User-Agent 生成器\n`);
  console.log(`📊 生成 ${count} 个 User-Agent...\n`);
  console.log('=' .repeat(80));
  
  if (count === 1) {
    // 单个生成 - 显示详细信息
    const result = generateFacebookUserAgent();
    
    console.log('\n✅ 生成完成！\n');
    console.log('📱 User-Agent:');
    console.log(result.userAgent);
    console.log('\n📋 详细信息:');
    console.log(`   设备: ${result.metadata.device.name} (${result.metadata.device.model})`);
    console.log(`   Android: ${result.metadata.android.version} (Build: ${result.metadata.android.buildId})`);
    console.log(`   Facebook: ${result.metadata.facebook.version}`);
    console.log(`   Chrome: ${result.metadata.chrome.version}`);
    console.log(`   标志: IABMV=${result.metadata.flags.hasIABMV}, FBNV=${result.metadata.flags.hasFBNV}`);
    console.log('\n' + '='.repeat(80));
  } else {
    // 批量生成 - 只显示 UA
    const results = generateMultipleUserAgents(count);
    
    console.log('\n✅ 生成完成！\n');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.userAgent}\n`);
    });
    console.log('='.repeat(80));
    console.log(`\n✨ 共生成 ${count} 个 User-Agent`);
  }
}

// ============================================
// 导出
// ============================================
module.exports = {
  generateFacebookUserAgent,
  generateMultipleUserAgents,
  DEVICE_MODELS,
  FB_VERSIONS,
  ANDROID_CONFIGS
};