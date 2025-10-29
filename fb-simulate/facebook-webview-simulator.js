/**
 * Facebook/Instagram Android WebView Simulator
 * 
 * 此脚本模拟Facebook和Instagram Android应用内置浏览器的特殊JavaScript注入和处理
 * 基于对真实应用的逆向分析和安全研究
 * 
 * @version 1.0.0
 * @author Security Research
 */

(function() {
    'use strict';
    
    console.log('[FB WebView Simulator] Initializing Facebook/Instagram in-app browser simulation...');
    
    // ==========================================
    // 1. User-Agent 修改
    // ==========================================
    
    /**
     * 修改User-Agent以模拟Facebook应用内浏览器
     * 实际应用中这是在Native层面完成的，这里通过覆盖navigator.userAgent实现模拟
     */
    const originalUserAgent = navigator.userAgent;
    const fbUserAgent = originalUserAgent + ' [FB_IAB/FB4A;FBAV/250.0.0.14.241;]';
    
    // 尝试覆盖userAgent (某些浏览器可能不允许)
    try {
        Object.defineProperty(navigator, 'userAgent', {
            get: function() {
                return fbUserAgent;
            },
            configurable: true
        });
        console.log('[FB WebView] User-Agent modified:', fbUserAgent);
    } catch(e) {
        console.warn('[FB WebView] Could not modify User-Agent (read-only in this browser)');
    }
    
    // ==========================================
    // 2. 注入全局Window属性
    // ==========================================
    
    /**
     * Facebook WebView注入的全局属性
     * 这些属性的具体用途未公开，可能与存储配额相关
     */
    window.TEMPORARY = 0;
    window.PERSISTENT = 1;
    console.log('[FB WebView] Global properties injected: window.TEMPORARY, window.PERSISTENT');
    
    // ==========================================
    // 3. FbQuoteShareJSInterface - 文本选择追踪
    // ==========================================
    
    /**
     * 模拟Facebook的引用分享接口
     * 实际应用中这是通过Android的addJavascriptInterface注入的
     */
    window.FbQuoteShareJSInterface = {
        /**
         * 当用户选择文本时调用
         * @param {string} selectedText - 用户选择的文本内容
         * @param {string} url - 当前页面的URL
         */
        onSelectionChange: function(selectedText, url) {
            console.log('[FB WebView] Text selection detected:');
            console.log('  - Selected text:', selectedText);
            console.log('  - Page URL:', url);
            
            // 在真实应用中，这里会将数据传回原生应用
            // 模拟数据收集
            if (selectedText && selectedText.length > 0) {
                const selectionData = {
                    text: selectedText,
                    url: url,
                    timestamp: new Date().toISOString(),
                    length: selectedText.length
                };
                
                // 触发自定义事件，供调试使用
                window.dispatchEvent(new CustomEvent('fb-text-selection', {
                    detail: selectionData
                }));
            }
        }
    };
    
    /**
     * 监听文本选择变化
     */
    document.addEventListener('selectionchange', function() {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            window.FbQuoteShareJSInterface.onSelectionChange(
                selectedText,
                window.location.href
            );
        }
    });
    
    console.log('[FB WebView] FbQuoteShareJSInterface injected and active');
    
    // ==========================================
    // 5. PCM.js 注入检测和模拟
    // ==========================================
    
    /**
     * 检查并注入pcm.js脚本标记
     * pcm = Private Click Measurement (隐私点击测量)
     */
    function injectPCMScript() {
        // 检查是否已经注入
        if (document.getElementById('iab-pcm-sdk')) {
            console.log('[FB WebView] PCM SDK already injected');
            return;
        }
        
        console.log('[FB WebView] Injecting PCM SDK marker...');
        
        // 创建标记元素
        const pcmMarker = document.createElement('span');
        pcmMarker.id = 'iab-pcm-sdk';
        pcmMarker.style.display = 'none';
        pcmMarker.setAttribute('data-fb-iab', 'true');
        pcmMarker.setAttribute('data-version', '1.0.0');
        
        // 插入到文档
        if (document.body) {
            document.body.appendChild(pcmMarker);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(pcmMarker);
            });
        }
        
        // 模拟pcm.js的功能（简化版）
        window._fbq = window._fbq || [];
        window.fbq = function() {
            console.log('[FB WebView] Facebook Pixel event:', arguments);
            window._fbq.push(arguments);
        };
        
        console.log('[FB WebView] PCM SDK marker injected');
    }
    
    // 在DOM准备好后注入
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPCMScript);
    } else {
        injectPCMScript();
    }
    
    // ==========================================
    // 6. 自动填充SDK标记
    // ==========================================
    
    /**
     * Instagram/Facebook的自动填充功能标记
     */
    function injectAutofillMarker() {
        if (document.getElementById('iab-autofill-sdk')) {
            return;
        }
        
        const autofillMarker = document.createElement('span');
        autofillMarker.id = 'iab-autofill-sdk';
        autofillMarker.style.display = 'none';
        autofillMarker.setAttribute('data-fb-autofill', 'enabled');
        
        if (document.body) {
            document.body.appendChild(autofillMarker);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(autofillMarker);
            });
        }
        
        console.log('[FB WebView] Autofill SDK marker injected');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAutofillMarker);
    } else {
        injectAutofillMarker();
    }
    
    // ==========================================
    // 7. 性能监控
    // ==========================================
    
    /**
     * Facebook的性能监控代码
     * 收集页面加载性能指标
     */
    function fbPerformanceMonitoring() {
        try {
            // 避免在about:blank页面执行
            if (window.location.href === 'about:blank') {
                return;
            }
            
            // 检查必要的API是否可用
            if (!window.performance || 
                !window.performance.timing || 
                !document || 
                !document.body) {
                return;
            }
            
            // 检查页面是否有有效内容
            if (document.body.scrollHeight <= 0 || 
                !document.body.children || 
                document.body.children.length < 1) {
                return;
            }
            
            const timing = window.performance.timing;
            
            // 记录各项性能指标
            if (timing.responseEnd > 0) {
                console.log('[FB WebView] FBNavResponseEnd:', timing.responseEnd);
            }
            
            if (timing.domContentLoadedEventStart > 0) {
                console.log('[FB WebView] FBNavDomContentLoaded:', timing.domContentLoadedEventStart);
            }
            
            if (timing.loadEventEnd > 0) {
                console.log('[FB WebView] FBNavLoadEventEnd:', timing.loadEventEnd);
            }
            
            // 检测AMP页面
            const htmlElement = document.getElementsByTagName('html')[0];
            if (htmlElement) {
                const isAMP = htmlElement.hasAttribute('amp') || 
                             htmlElement.hasAttribute('⚡');
                console.log('[FB WebView] FBNavAmpDetect:', isAMP);
            }
            
        } catch (err) {
            console.error('[FB WebView] fb_navigation_timing_error:', err.message);
        }
    }
    
    // 立即执行一次
    fbPerformanceMonitoring();
    
    // 在DOMContentLoaded时再次执行
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[FB WebView] FBNavDomContentLoaded:', 
                   window.performance.timing.domContentLoadedEventStart);
        fbPerformanceMonitoring();
    });
    
    // 在load事件时执行
    window.addEventListener('load', function() {
        fbPerformanceMonitoring();
    });
    
    // ==========================================
    // 8. 表单输入监控（可选，隐私敏感）
    // ==========================================
    
    /**
     * 监控表单输入（高度隐私敏感）
     * 在真实应用中，这允许追踪所有用户输入
     * 这里仅作演示，实际使用时应谨慎
     */
    let formInputMonitoring = false; // 默认关闭
    
    window.FbWebViewConfig = {
        enableFormMonitoring: function() {
            if (formInputMonitoring) return;
            
            formInputMonitoring = true;
            console.warn('[FB WebView] Form input monitoring ENABLED - This is privacy sensitive!');
            
            // 监听所有input事件
            document.addEventListener('input', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    const fieldType = e.target.type || 'text';
                    const fieldName = e.target.name || e.target.id || 'unnamed';
                    
                    // 不记录密码等敏感字段的实际值
                    if (fieldType === 'password' || fieldType === 'email') {
                        console.log('[FB WebView] Form input detected:', {
                            type: fieldType,
                            name: fieldName,
                            value: '[REDACTED]'
                        });
                    } else {
                        console.log('[FB WebView] Form input detected:', {
                            type: fieldType,
                            name: fieldName,
                            valueLength: e.target.value.length
                        });
                    }
                }
            }, true);
        },
        
        disableFormMonitoring: function() {
            formInputMonitoring = false;
            console.log('[FB WebView] Form input monitoring disabled');
        }
    };
    
    // ==========================================
    // 9. 点击和滚动追踪
    // ==========================================
    
    /**
     * 记录用户交互行为
     */
    let interactionTracking = true;
    
    document.addEventListener('click', function(e) {
        if (!interactionTracking) return;
        
        console.log('[FB WebView] Click detected:', {
            target: e.target.tagName,
            id: e.target.id,
            class: e.target.className,
            x: e.clientX,
            y: e.clientY
        });
    }, true);
    
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!interactionTracking) return;
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            console.log('[FB WebView] Scroll position:', {
                x: window.scrollX,
                y: window.scrollY,
                scrollHeight: document.documentElement.scrollHeight,
                clientHeight: document.documentElement.clientHeight
            });
        }, 150);
    }, true);
    
    window.FbWebViewConfig.enableInteractionTracking = function() {
        interactionTracking = true;
        console.log('[FB WebView] Interaction tracking enabled');
    };
    
    window.FbWebViewConfig.disableInteractionTracking = function() {
        interactionTracking = false;
        console.log('[FB WebView] Interaction tracking disabled');
    };
    
    // ==========================================
    // 初始化完成
    // ==========================================
    
    console.log('[FB WebView Simulator] ✓ Initialization complete');
    console.log('[FB WebView Simulator] Configuration:');
    console.log('  - User-Agent: Modified');
    console.log('  - Global properties: Injected');
    console.log('  - FbQuoteShareJSInterface: Active');
    console.log('  - Performance monitoring: Active');
    console.log('  - PCM SDK: Injected');
    console.log('  - Form monitoring: Disabled (use FbWebViewConfig.enableFormMonitoring() to enable)');
    console.log('  - Interaction tracking: Enabled');
    
    // 触发初始化完成事件
    window.dispatchEvent(new CustomEvent('fb-webview-ready', {
        detail: {
            version: '1.0.0',
            features: [
                'user-agent',
                'global-properties',
                'quote-share',
                'performance-monitoring',
                'pcm-sdk',
                'interaction-tracking'
            ]
        }
    }));
    
})();