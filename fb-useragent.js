const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================
// 配置文件路径
// ============================================
const DATA_DIR = path.join(__dirname, 'fb_simulator_data');
const FILES = {
  campaigns: path.join(DATA_DIR, 'campaigns.json'),
  adsets: path.join(DATA_DIR, 'adsets.json'),
  ads: path.join(DATA_DIR, 'ads.json'),
  devices: path.join(DATA_DIR, 'devices.json'),
  state: path.join(DATA_DIR, 'state.json'),
  usage_log: path.join(DATA_DIR, 'usage_log.json')
};

// ============================================
// 真实设备型号池（基于实际数据）
// ============================================
const DEVICE_MODELS = {
  samsung: [
    { model: 'SM-S721W', name: 'Galaxy S21 FE', probability: 0.12 },
    { model: 'SM-G991U', name: 'Galaxy S21 5G', probability: 0.15 },
    { model: 'SM-S911U', name: 'Galaxy S23', probability: 0.10 },
    { model: 'SM-A326U', name: 'Galaxy A32 5G', probability: 0.08 },
    { model: 'SM-G981B', name: 'Galaxy S20', probability: 0.07 },
    { model: 'SM-S926B', name: 'Galaxy S24+', probability: 0.05 },
    { model: 'SM-S928U', name: 'Galaxy S24 Ultra', probability: 0.06 },
    { model: 'SM-A025A', name: 'Galaxy A02', probability: 0.05 },
    { model: 'SM-G960U1', name: 'Galaxy S9', probability: 0.04 }
  ],
  motorola: [
    { model: 'moto g stylus 5G - 2024', name: 'Moto G Stylus 5G', probability: 0.08 },
    { model: 'moto g play - 2024', name: 'Moto G Play', probability: 0.06 }
  ],
  xiaomi: [
    { model: '2201117SG', name: 'Redmi Note 11', probability: 0.05 },
    { model: '2201116SG', name: 'Redmi Note 11 Pro', probability: 0.04 }
  ],
  other: [
    { model: 'T704V', name: 'TCL Tab', probability: 0.03 },
    { model: 'T614D', name: 'Generic Tablet', probability: 0.02 }
  ]
};

// ============================================
// Facebook应用版本分布
// ============================================
const FB_VERSIONS = [
  { version: '536.0.0.46.77', weight: 0.35, chrome: '141.0.7390.119' },
  { version: '535.0.0.49.72', weight: 0.25, chrome: '141.0.7390.97' },
  { version: '534.0.0.56.76', weight: 0.20, chrome: '141.0.7390.62' },
  { version: '536.0.0.46.77', weight: 0.12, chrome: '141.0.7390.93' },
  { version: '489.0.0.66.81', weight: 0.08, chrome: '130.0.6723.99' }
];

// Android版本分布
const ANDROID_VERSIONS = [
  { version: 16, weight: 0.10, build_prefix: 'BP2A' },
  { version: 15, weight: 0.30, build_prefix: 'AP3A' },
  { version: 14, weight: 0.25, build_prefix: 'UP1A' },
  { version: 13, weight: 0.20, build_prefix: 'TP1A' },
  { version: 12, weight: 0.10, build_prefix: 'SP1A' },
  { version: 10, weight: 0.05, build_prefix: 'QP1A' }
];

// ============================================
// 初始化函数
// ============================================
function initializeDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 初始化各个数据文件
  const defaultData = {
    campaigns: { active: [], archived: [], nextId: 6900000000000 },
    adsets: { active: [], archived: [], nextId: 6910000000000 },
    ads: { active: [], archived: [], nextId: 6920000000000 },
    devices: generateInitialDevicePool(),
    state: {
      totalGenerations: 0,
      lastGeneratedAt: null,
      currentCampaignIdRange: { min: 6900000000000, max: 7000000000000 },
      stats: {
        campaignsCreated: 0,
        adsetsCreated: 0,
        adsCreated: 0
      }
    },
    usage_log: { entries: [] }
  };

  Object.keys(FILES).forEach(key => {
    if (!fs.existsSync(FILES[key])) {
      fs.writeFileSync(FILES[key], JSON.stringify(defaultData[key], null, 2));
    }
  });
}

// ============================================
// 设备池生成
// ============================================
function generateInitialDevicePool() {
  const pool = [];
  let deviceId = 1;

  // 为每个品牌的设备型号创建实例
  Object.entries(DEVICE_MODELS).forEach(([brand, models]) => {
    models.forEach(modelInfo => {
      // 根据概率创建多个实例（模拟市场占有率）
      const instanceCount = Math.max(1, Math.floor(modelInfo.probability * 100));
      
      for (let i = 0; i < instanceCount; i++) {
        pool.push({
          id: deviceId++,
          brand,
          model: modelInfo.model,
          name: modelInfo.name,
          lastUsed: null,
          useCount: 0
        });
      }
    });
  });

  return { devices: pool, totalDevices: pool.length };
}

// ============================================
// 辅助函数：加权随机选择
// ============================================
function weightedRandom(items, weightKey = 'weight') {
  const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= (item[weightKey] || 1);
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

// ============================================
// ID生成器
// ============================================
function generateCampaignId(currentMax) {
  // 基于时间和随机性生成递增ID
  const increment = Math.floor(Math.random() * 50000000) + 10000000; // 10M-60M增量
  return currentMax + increment;
}

function generateAdSetId(campaignId) {
  // AdSet ID 比 Campaign ID 大约大10M-50M
  const increment = Math.floor(Math.random() * 40000000) + 10000000;
  return campaignId + increment;
}

function generateAdId(adsetId) {
  // Ad ID 比 AdSet ID 大约大200-5000
  const increment = Math.floor(Math.random() * 4800) + 200;
  return adsetId + increment;
}

// ============================================
// fbclid 生成器（模拟真实编码）
// ============================================
function generateFbclid() {
  // 基于Base64的随机字符串，模拟真实fbclid结构
  const segments = [
    crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, ''),
    crypto.randomBytes(8).toString('base64').replace(/[+/=]/g, ''),
    crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, ''),
    crypto.randomBytes(16).toString('base64').replace(/[+/=]/g, '')
  ];
  
  // 使用URL安全的Base64字符
  return 'IwZXh0bgNhZW0' + segments.join('').replace(/\+/g, '-').replace(/\//g, '_').substring(0, 120);
}

// ============================================
// Build ID 生成器
// ============================================
function generateBuildId(androidVersion, buildPrefix) {
  const now = new Date();
  const year = now.getFullYear().toString().substring(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const buildNumber = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  const revision = ['A1', 'A2', 'A3', 'B1'][Math.floor(Math.random() * 4)];
  
  return `${buildPrefix}.${year}${month}${day}.${buildNumber}.${revision}`;
}

// ============================================
// Campaign管理
// ============================================
function getOrCreateCampaign(campaignsData) {
  const useExisting = Math.random() < 0.70; // 70%概率使用现有Campaign
  
  if (useExisting && campaignsData.active.length > 0) {
    // 从活跃Campaign中选择，偏向最近使用的
    const sortedCampaigns = campaignsData.active
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    
    // 前20%的Campaign有更高被选中概率
    const topIndex = Math.floor(sortedCampaigns.length * 0.2) || 1;
    const campaign = sortedCampaigns[Math.floor(Math.random() * Math.max(topIndex, sortedCampaigns.length))];
    
    campaign.useCount++;
    campaign.lastUsed = Date.now();
    
    return campaign;
  }
  
  // 创建新Campaign
  const campaignId = generateCampaignId(campaignsData.nextId);
  const campaign = {
    id: campaignId,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    useCount: 1,
    type: Math.random() > 0.5 ? '13digit' : '18digit' // 模拟两种ID格式
  };
  
  // 如果是18位格式，调整ID
  if (campaign.type === '18digit') {
    campaign.id = parseInt('120' + String(campaignId).substring(3));
  }
  
  campaignsData.active.push(campaign);
  campaignsData.nextId = campaignId + 1;
  
  // 维护活跃Campaign数量（最多保留20个）
  if (campaignsData.active.length > 20) {
    const archived = campaignsData.active.shift();
    campaignsData.archived.push(archived);
  }
  
  return campaign;
}

// ============================================
// AdSet管理
// ============================================
function getOrCreateAdSet(adsetsData, campaignId) {
  // 查找属于该Campaign的AdSets
  const campaignAdsets = adsetsData.active.filter(as => as.campaignId === campaignId);
  
  const useExisting = Math.random() < 0.60 && campaignAdsets.length > 0;
  
  if (useExisting) {
    const adset = campaignAdsets[Math.floor(Math.random() * campaignAdsets.length)];
    adset.useCount++;
    adset.lastUsed = Date.now();
    return adset;
  }
  
  // 创建新AdSet
  const adsetId = generateAdSetId(campaignId);
  const adset = {
    id: adsetId,
    campaignId: campaignId,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    useCount: 1
  };
  
  adsetsData.active.push(adset);
  adsetsData.nextId = adsetId + 1;
  
  // 每个Campaign最多10个AdSets
  if (campaignAdsets.length > 10) {
    const toArchive = campaignAdsets.shift();
    adsetsData.archived.push(toArchive);
    adsetsData.active = adsetsData.active.filter(as => as.id !== toArchive.id);
  }
  
  return adset;
}

// ============================================
// Ad管理
// ============================================
function getOrCreateAd(adsData, adsetId) {
  const adsetAds = adsData.active.filter(ad => ad.adsetId === adsetId);
  
  const useExisting = Math.random() < 0.80 && adsetAds.length > 0;
  
  if (useExisting) {
    const ad = adsetAds[Math.floor(Math.random() * adsetAds.length)];
    ad.useCount++;
    ad.lastUsed = Date.now();
    return ad;
  }
  
  // 创建新Ad
  const adId = generateAdId(adsetId);
  const ad = {
    id: adId,
    adsetId: adsetId,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    useCount: 1
  };
  
  adsData.active.push(ad);
  adsData.nextId = adId + 1;
  
  // 每个AdSet最多15个Ads
  if (adsetAds.length > 15) {
    const toArchive = adsetAds.shift();
    adsData.archived.push(toArchive);
    adsData.active = adsData.active.filter(a => a.id !== toArchive.id);
  }
  
  return ad;
}

// ============================================
// 设备选择
// ============================================
function selectDevice(devicesData) {
  // 模拟真实使用：某些设备更常被使用
  const devices = devicesData.devices;
  
  // 70%概率选择最近使用过的设备，30%随机选择
  if (Math.random() < 0.70 && devices.some(d => d.useCount > 0)) {
    const usedDevices = devices.filter(d => d.useCount > 0);
    const device = usedDevices[Math.floor(Math.random() * usedDevices.length)];
    device.useCount++;
    device.lastUsed = Date.now();
    return device;
  }
  
  // 随机选择
  const device = devices[Math.floor(Math.random() * devices.length)];
  device.useCount++;
  device.lastUsed = Date.now();
  return device;
}

// ============================================
// UA字符串生成
// ============================================
function generateUserAgent(device, fbVersion, androidVersion) {
  const android = weightedRandom(ANDROID_VERSIONS, 'weight');
  const buildId = generateBuildId(android.version, android.build_prefix);
  
  // IABMV参数：30%概率包含
  const hasIABMV = Math.random() < 0.30;
  const iabmvPart = hasIABMV ? 'IABMV/1;' : '';
  
  // 部分设备可能有FBNV标记
  const hasFBNV = Math.random() < 0.10;
  const fbnvPart = hasFBNV ? ' FBNV/500' : '';
  
  const ua = `Mozilla/5.0 (Linux; Android ${android.version}; ${device.model} Build/${buildId}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${fbVersion.chrome} Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/${fbVersion.version};${iabmvPart}]${fbnvPart}`;
  
  return ua;
}

// ============================================
// 主生成函数
// ============================================
function generateFacebookAdData() {
  console.log('🚀 Facebook广告数据生成器启动...\n');
  
  // 初始化
  initializeDataDirectory();
  
  // 读取所有数据文件
  const campaignsData = JSON.parse(fs.readFileSync(FILES.campaigns, 'utf8'));
  const adsetsData = JSON.parse(fs.readFileSync(FILES.adsets, 'utf8'));
  const adsData = JSON.parse(fs.readFileSync(FILES.ads, 'utf8'));
  const devicesData = JSON.parse(fs.readFileSync(FILES.devices, 'utf8'));
  const stateData = JSON.parse(fs.readFileSync(FILES.state, 'utf8'));
  const usageLog = JSON.parse(fs.readFileSync(FILES.usage_log, 'utf8'));
  
  // 生成广告层级结构
  const campaign = getOrCreateCampaign(campaignsData);
  const adset = getOrCreateAdSet(adsetsData, campaign.id);
  const ad = getOrCreateAd(adsData, adset.id);
  
  // 选择设备
  const device = selectDevice(devicesData);
  
  // 选择FB版本
  const fbVersion = weightedRandom(FB_VERSIONS, 'weight');
  
  // 生成fbclid
  const fbclid = generateFbclid();
  
  // 生成UTM参数
  const utmSource = Math.random() > 0.5 ? 'facebook' : 'fb';
  const utmMedium = ['facebook', 'paid', 'cpc'][Math.floor(Math.random() * 3)];
  
  const parameters = {
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: campaign.id.toString(),
    utm_content: adset.id.toString(),
    utm_term: ad.id.toString(),
    utm_id: campaign.id.toString(),
    fbclid: fbclid
  };
  
  // 生成UA
  const userAgent = generateUserAgent(device, fbVersion);
  
  // 更新统计
  stateData.totalGenerations++;
  stateData.lastGeneratedAt = new Date().toISOString();
  
  // 记录使用日志
  const logEntry = {
    timestamp: new Date().toISOString(),
    campaignId: campaign.id,
    adsetId: adset.id,
    adId: ad.id,
    deviceId: device.id,
    fbVersion: fbVersion.version,
    isNewCampaign: campaign.useCount === 1,
    isNewAdset: adset.useCount === 1,
    isNewAd: ad.useCount === 1
  };
  usageLog.entries.push(logEntry);
  
  // 只保留最近1000条日志
  if (usageLog.entries.length > 1000) {
    usageLog.entries = usageLog.entries.slice(-1000);
  }
  
  // 保存所有数据
  fs.writeFileSync(FILES.campaigns, JSON.stringify(campaignsData, null, 2));
  fs.writeFileSync(FILES.adsets, JSON.stringify(adsetsData, null, 2));
  fs.writeFileSync(FILES.ads, JSON.stringify(adsData, null, 2));
  fs.writeFileSync(FILES.devices, JSON.stringify(devicesData, null, 2));
  fs.writeFileSync(FILES.state, JSON.stringify(stateData, null, 2));
  fs.writeFileSync(FILES.usage_log, JSON.stringify(usageLog, null, 2));
  
  // 输出结果
  const result = {
    parameters,
    userAgent
  };
  
  console.log('✅ 生成完成！\n');
  console.log('📊 统计信息:');
  console.log(`   总生成次数: ${stateData.totalGenerations}`);
  console.log(`   活跃Campaigns: ${campaignsData.active.length}`);
  console.log(`   活跃AdSets: ${adsetsData.active.length}`);
  console.log(`   活跃Ads: ${adsData.active.length}`);
  console.log(`   设备池大小: ${devicesData.totalDevices}`);
  console.log('');
  console.log('🎯 生成的数据:');
  console.log('');
  console.log('📌 URL参数:');
  console.log(JSON.stringify(parameters, null, 2));
  console.log('');
  console.log('📱 User-Agent:');
  console.log(userAgent);
  console.log('');
  console.log('🔍 详细信息:');
  console.log(`   Campaign: ${campaign.id} (使用 ${campaign.useCount} 次)`);
  console.log(`   AdSet: ${adset.id} (使用 ${adset.useCount} 次)`);
  console.log(`   Ad: ${ad.id} (使用 ${ad.useCount} 次)`);
  console.log(`   设备: ${device.name} (${device.model})`);
  console.log(`   FB版本: ${fbVersion.version}`);
  console.log('');
  console.log(`💾 数据已保存至: ${DATA_DIR}`);
  
  return result;
}

// ============================================
// 执行生成
// ============================================
if (require.main === module) {
  generateFacebookAdData();
}

module.exports = { generateFacebookAdData };