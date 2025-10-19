/**
 * Facebook 广告追踪 URL 生成器 (完善版)
 * 修复所有问题 + 更新域名
 */

class FacebookURLGenerator {
    /**
     * 生成真正随机的 18 位 Facebook 广告 ID
     */
    generateFacebookId() {
      // 第一位：1-9 (避免0开头)
      const firstDigit = Math.floor(Math.random() * 9) + 1;
      
      // 剩余17位：0-9
      let remaining = '';
      for (let i = 0; i < 17; i++) {
        remaining += Math.floor(Math.random() * 10);
      }
      
      return firstDigit + remaining;
    }
  
    /**
     * 生成 Facebook Click ID (fbclid)
     * 严格模拟真实格式
     */
    generateFbclid() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      
      const randomStr = (len) => {
        let result = '';
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
  
      // 真实fbclid格式：以"Iw"开头，以"_aem_"分隔，总长度120-150字符
      const part1 = randomStr(12);   // IwZXh0bgNhZW0
      const part2 = randomStr(10);   // BMABhZGlkAa
      const part3 = randomStr(50);   // 主要内容部分
      const part4 = randomStr(30);   // 次要内容
      const part5 = randomStr(27);   // 最后部分
      
      return `Iw${part1}${part2}${part3}${part4}_aem_${part5}`;
    }
  
    /**
     * 生成完整的 Facebook 广告 URL
     * ⚠️ 注意：参数顺序必须与Facebook实际顺序一致
     */
    generateURL(options = {}) {
      const {
        domain = 'vis.mazubaoyou.org',
        campaignName = 'default_campaign'
      } = options;
  
      // 生成各个ID（每次都完全不同）
      const campaignId = this.generateFacebookId();
      const adSetId = this.generateFacebookId();
      const adId = this.generateFacebookId();
      const fbclid = this.generateFbclid();
  
      // ⚠️ 关键修复：手动构建URL以保持参数顺序
      // Facebook的参数顺序：utm_source → utm_medium → utm_campaign → utm_content → fbclid → utm_id → utm_term
      const params = [
        `utm_source=facebook`,
        `utm_medium=facebook`,
        `utm_campaign=${campaignId}`,
        `utm_content=${adId}`,
        `fbclid=${fbclid}`,
        `utm_id=${campaignId}`,  // 与 utm_campaign 相同
        `utm_term=${adSetId}`
      ].join('&');
  
      // 去掉路径，直接在域名后加参数
      const fullUrl = `https://${domain}?${params}`;
  
      return {
        url: fullUrl,
        metadata: {
          domain,
          campaignId,
          adSetId,
          adId,
          fbclid,
          campaignName,
          generatedAt: new Date().toISOString(),
          // 新增：验证数据
          validation: {
            campaignIdLength: campaignId.length,
            adSetIdLength: adSetId.length,
            adIdLength: adId.length,
            fbclidLength: fbclid.length,
            allIdsUnique: new Set([campaignId, adSetId, adId]).size === 3
          }
        }
      };
    }
  
    /**
     * 批量生成多个 URL
     */
    generateBatch(count = 5, options = {}) {
      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(this.generateURL({
          ...options,
          campaignName: options.campaignName || `campaign_${i + 1}`
        }));
      }
      return results;
    }
  
    /**
     * 解析现有 URL
     */
    parseURL(url) {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        return {
          domain: urlObj.hostname,
          path: urlObj.pathname,
          utmParams: {
            source: params.get('utm_source'),
            medium: params.get('utm_medium'),
            campaign: params.get('utm_campaign'),
            content: params.get('utm_content'),
            term: params.get('utm_term'),
            id: params.get('utm_id')
          },
          fbclid: params.get('fbclid'),
          validation: {
            hasFbclid: params.has('fbclid'),
            campaignMatchesId: params.get('utm_campaign') === params.get('utm_id'),
            allUtmPresent: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].every(p => params.has(p))
          }
        };
      } catch (error) {
        console.error('URL 解析失败:', error.message);
        return null;
      }
    }
  
    /**
     * 验证生成的URL格式是否正确
     */
    validateURL(url) {
      const parsed = this.parseURL(url);
      if (!parsed) return { valid: false, errors: ['无法解析URL'] };
  
      const errors = [];
      
      // 检查必需参数
      if (!parsed.utmParams.source) errors.push('缺少 utm_source');
      if (!parsed.utmParams.campaign) errors.push('缺少 utm_campaign');
      if (!parsed.fbclid) errors.push('缺少 fbclid');
      
      // 检查ID长度
      if (parsed.utmParams.campaign?.length !== 18) errors.push('utm_campaign 不是18位');
      if (parsed.utmParams.content?.length !== 18) errors.push('utm_content 不是18位');
      if (parsed.utmParams.term?.length !== 18) errors.push('utm_term 不是18位');
      
      // 检查fbclid格式
      if (parsed.fbclid && !parsed.fbclid.startsWith('Iw')) errors.push('fbclid 格式不正确（应以Iw开头）');
      if (parsed.fbclid && parsed.fbclid.length < 100) errors.push('fbclid 长度过短');
      
      // 检查逻辑一致性
      if (!parsed.validation.campaignMatchesId) errors.push('utm_campaign 和 utm_id 不一致');
  
      return {
        valid: errors.length === 0,
        errors,
        details: parsed
      };
    }
  }
  
  // ============= 使用示例 =============
  
  const generator = new FacebookURLGenerator();
  
  console.log('='.repeat(100));
  console.log('Facebook 广告 URL 生成器 (完善版)');
  console.log('域名: https://vis.mazubaoyou.org');
  console.log('='.repeat(100));
  
  // 示例 1: 生成单个URL并验证
  console.log('\n【示例 1】生成并验证单个URL\n');
  const result = generator.generateURL({
    campaignName: '春季促销活动'
  });
  
  console.log('完整URL:');
  console.log(result.url);
  
  console.log('\n参数详情:');
  console.log(`  Campaign ID: ${result.metadata.campaignId} (${result.metadata.validation.campaignIdLength}位)`);
  console.log(`  AdSet ID:    ${result.metadata.adSetId} (${result.metadata.validation.adSetIdLength}位)`);
  console.log(`  Ad ID:       ${result.metadata.adId} (${result.metadata.validation.adIdLength}位)`);
  console.log(`  fbclid:      ${result.metadata.fbclid.substring(0, 50)}... (${result.metadata.validation.fbclidLength}位)`);
  console.log(`  所有ID唯一:  ${result.metadata.validation.allIdsUnique ? '✅ 是' : '❌ 否'}`);
  
  // 验证生成的URL
  const validation = generator.validateURL(result.url);
  console.log('\nURL验证结果:');
  console.log(`  有效性: ${validation.valid ? '✅ 通过' : '❌ 失败'}`);
  if (validation.errors.length > 0) {
    console.log(`  错误: ${validation.errors.join(', ')}`);
  }
  
//   // 示例 2: 批量生成
//   console.log('\n' + '='.repeat(100));
//   console.log('\n【示例 2】批量生成 3 个URL\n');
  
//   const batch = generator.generateBatch(3, {
//     campaignName: '双十一大促'
//   });
  
//   batch.forEach((item, index) => {
//     console.log(`\n链接 ${index + 1}:`);
//     console.log(item.url);
//     console.log(`Campaign: ${item.metadata.campaignId}`);
//     console.log(`AdSet:    ${item.metadata.adSetId}`);
//     console.log(`Ad:       ${item.metadata.adId}`);
//   });
  
//   // 示例 3: ID唯一性验证
//   console.log('\n' + '='.repeat(100));
//   console.log('\n【示例 3】验证ID唯一性 (生成20个URL)\n');
  
//   const testBatch = generator.generateBatch(20);
//   const allIds = testBatch.flatMap(item => [
//     item.metadata.campaignId,
//     item.metadata.adSetId,
//     item.metadata.adId
//   ]);
  
//   const uniqueIds = new Set(allIds);
//   console.log(`生成了 ${allIds.length} 个ID`);
//   console.log(`唯一ID数量: ${uniqueIds.size} 个`);
//   console.log(`结果: ${allIds.length === uniqueIds.size ? '✅ 所有ID都不相同！' : '❌ 存在重复ID'}`);
  
//   // 示例 4: 解析原始URL
//   console.log('\n' + '='.repeat(100));
//   console.log('\n【示例 4】解析原始URL\n');
  
//   const originalUrl = 'https://www.awwoe.top/articles/119?utm_source=facebook&utm_medium=facebook&utm_campaign=120235554089990421&utm_content=120235554090010421&fbclid=IwZXh0bgNhZW0BMABhZGlkAaspnIVbwpUBHoX46X_GQTQzSV5qijTbknwe_0XNptYxTl-B3CjK0LR5tMKkPPQQ4q1FwQCl_aem_TPuy7TzLmPfJZYx-kOuzgg&utm_id=120235554089990421&utm_term=120235554090000421';
  
//   const parsed = generator.parseURL(originalUrl);
//   console.log('原始URL解析:');
//   console.log(JSON.stringify(parsed, null, 2));
  
//   // 示例 5: 快速使用
//   console.log('\n' + '='.repeat(100));
//   console.log('\n【示例 5】快速生成函数\n');
  
//   function quickGenerate() {
//     const gen = new FacebookURLGenerator();
//     return gen.generateURL().url;
//   }
  
//   console.log('快速生成1:', quickGenerate());
//   console.log('\n快速生成2:', quickGenerate());
//   console.log('\n快速生成3:', quickGenerate());
  
//   // 导出
//   if (typeof module !== 'undefined' && module.exports) {
//     module.exports = FacebookURLGenerator;
//   }