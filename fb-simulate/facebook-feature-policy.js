/**
 * Facebook WebView Feature Policy Detection
 * 
 * 此脚本模拟Facebook WebView对浏览器Feature Policy的检测
 * Facebook会检测大量的浏览器功能策略以了解WebView的能力
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';
    
    console.log('[FB Feature Policy] Initializing Feature Policy detection...');
    
    /**
     * 获取页面上所有Feature Policy的允许列表
     * @param {Array<string>} features - 要检测的功能列表
     * @returns {Object} 功能策略映射
     */
    function getFeaturePolicyAllowListOnPage(features) {
        const map = {};
        const featurePolicy = document.policy || document.featurePolicy;
        
        if (!featurePolicy) {
            console.warn('[FB Feature Policy] Feature Policy API not available in this browser');
            return map;
        }
        
        for (const feature of features) {
            try {
                map[feature] = {
                    allowed: featurePolicy.allowsFeature(feature),
                    allowList: featurePolicy.getAllowlistForFeature(feature) || []
                };
            } catch (e) {
                // 某些策略可能不被支持
                map[feature] = {
                    allowed: false,
                    allowList: [],
                    error: e.message
                };
            }
        }
        
        return map;
    }
    
    /**
     * Facebook检测的所有Feature Policy指令
     * 这个列表来自真实的Facebook WebView代码
     */
    const allPolicies = [
        'geolocation',
        'midi',
        'ch-ect',
        'execution-while-not-rendered',
        'layout-animations',
        'vertical-scroll',
        'forms',
        'oversized-images',
        'document-access',
        'magnetometer',
        'picture-in-picture',
        'modals',
        'unoptimized-lossless-images-strict',
        'accelerometer',
        'vr',
        'document-domain',
        'serial',
        'encrypted-media',
        'font-display-late-swap',
        'unsized-media',
        'ch-downlink',
        'ch-ua-arch',
        'presentation',
        'xr-spatial-tracking',
        'lazyload',
        'idle-detection',
        'popups',
        'scripts',
        'unoptimized-lossless-images',
        'sync-xhr',
        'ch-width',
        'ch-ua-model',
        'top-navigation',
        'ch-lang',
        'camera',
        'ch-viewport-width',
        'loading-frame-default-eager',
        'payment',
        'pointer-lock',
        'focus-without-user-activation',
        'downloads-without-user-activation',
        'ch-rtt',
        'fullscreen',
        'autoplay',
        'execution-while-out-of-viewport',
        'ch-dpr',
        'hid',
        'usb',
        'wake-lock',
        'ch-ua-platform',
        'ambient-light-sensor',
        'gyroscope',
        'document-write',
        'unoptimized-lossy-images',
        'sync-script',
        'ch-device-memory',
        'orientation-lock',
        'ch-ua',
        'microphone'
    ];
    
    /**
     * 执行Feature Policy检测
     */
    function detectFeaturePolicies() {
        console.log('[FB Feature Policy] Detecting', allPolicies.length, 'feature policies...');
        
        const results = getFeaturePolicyAllowListOnPage(allPolicies);
        
        // 统计结果
        let supportedCount = 0;
        let allowedCount = 0;
        
        for (const [feature, data] of Object.entries(results)) {
            if (!data.error) {
                supportedCount++;
                if (data.allowed) {
                    allowedCount++;
                }
            }
        }
        
        console.log('[FB Feature Policy] Detection complete:');
        console.log('  - Total policies checked:', allPolicies.length);
        console.log('  - Supported by browser:', supportedCount);
        console.log('  - Currently allowed:', allowedCount);
        
        // 存储结果
        window.FbFeaturePolicyResults = results;
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('fb-feature-policy-detected', {
            detail: {
                results: results,
                stats: {
                    total: allPolicies.length,
                    supported: supportedCount,
                    allowed: allowedCount
                }
            }
        }));
        
        return results;
    }
    
    /**
     * 在页面加载完成后执行检测
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectFeaturePolicies);
    } else {
        detectFeaturePolicies();
    }
    
    /**
     * 导出公共API
     */
    window.FbFeaturePolicy = {
        /**
         * 手动触发检测
         */
        detect: detectFeaturePolicies,
        
        /**
         * 获取最近的检测结果
         */
        getResults: function() {
            return window.FbFeaturePolicyResults || {};
        },
        
        /**
         * 检查特定功能是否被允许
         * @param {string} feature - 功能名称
         * @returns {boolean} 是否允许
         */
        isFeatureAllowed: function(feature) {
            const results = window.FbFeaturePolicyResults || {};
            return results[feature] ? results[feature].allowed : false;
        },
        
        /**
         * 获取特定功能的允许列表
         * @param {string} feature - 功能名称
         * @returns {Array<string>} 允许的源列表
         */
        getFeatureAllowList: function(feature) {
            const results = window.FbFeaturePolicyResults || {};
            return results[feature] ? results[feature].allowList : [];
        },
        
        /**
         * 打印所有检测结果（美化输出）
         */
        printResults: function() {
            const results = window.FbFeaturePolicyResults || {};
            
            console.group('[FB Feature Policy] Detection Results');
            
            // 按状态分组
            const allowed = [];
            const denied = [];
            const unsupported = [];
            
            for (const [feature, data] of Object.entries(results)) {
                if (data.error) {
                    unsupported.push(feature);
                } else if (data.allowed) {
                    allowed.push({ feature, allowList: data.allowList });
                } else {
                    denied.push(feature);
                }
            }
            
            console.log('✓ Allowed features (' + allowed.length + '):');
            allowed.forEach(item => {
                const origins = item.allowList.length > 0 
                    ? item.allowList.join(', ') 
                    : 'all origins';
                console.log('  -', item.feature, '(' + origins + ')');
            });
            
            console.log('\n✗ Denied features (' + denied.length + '):');
            denied.forEach(feature => {
                console.log('  -', feature);
            });
            
            console.log('\n⚠ Unsupported features (' + unsupported.length + '):');
            unsupported.forEach(feature => {
                console.log('  -', feature);
            });
            
            console.groupEnd();
        }
    };
    
    console.log('[FB Feature Policy] Module loaded. Use FbFeaturePolicy.printResults() to see detailed results.');
    
})();