/**
 * 移动端长文本修复增强脚本
 * 专门针对移动设备的长文本显示问题进行修复
 */

class MobileTextFix {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isSmallScreen = window.innerWidth <= 480;
        this.init();
    }

    detectMobile() {
        const userAgent = navigator.userAgent;
        const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        
        return isMobileUA || (isTouchDevice && isSmallScreen);
    }

    init() {
        if (!this.isMobile) {
            console.log('MobileTextFix: 非移动设备，跳过移动端修复');
            return;
        }

        console.log('MobileTextFix: 移动设备检测到，启动移动端修复');
        
        // 页面加载完成后开始修复
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startMobileFix());
        } else {
            this.startMobileFix();
        }

        // 监听屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isSmallScreen = window.innerWidth <= 480;
                this.applyMobileFixes();
            }, 500);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.isSmallScreen = window.innerWidth <= 480;
            this.applyMobileFixes();
        });
    }

    startMobileFix() {
        // 立即应用移动端修复
        this.applyMobileFixes();

        // 设置观察器监控新消息
        this.setupObserver();

        // 定期检查（移动端网络可能不稳定）
        setInterval(() => this.applyMobileFixes(), 3000);
    }

    setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let hasNewMessages = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            (node.classList.contains('message') || node.querySelector('.message'))) {
                            hasNewMessages = true;
                        }
                    });
                }
            });

            if (hasNewMessages) {
                setTimeout(() => this.applyMobileFixes(), 100);
            }
        });

        const messageList = document.querySelector('.message-list');
        if (messageList) {
            observer.observe(messageList, {
                childList: true,
                subtree: true
            });
        }
    }

    applyMobileFixes() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => this.fixMobileMessage(message));
    }

    fixMobileMessage(messageElement) {
        try {
            // 修复消息容器
            this.applyMobileStyles(messageElement, {
                maxWidth: this.isSmallScreen ? '95%' : '90%',
                maxHeight: 'none',
                height: 'auto',
                overflow: 'visible'
            });

            // 修复消息内容
            const messageContent = messageElement.querySelector('.message-content');
            if (messageContent) {
                this.applyMobileStyles(messageContent, {
                    maxHeight: 'none',
                    height: 'auto',
                    overflow: 'visible',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word'
                });
            }

            // 修复文本消息
            const textMessages = messageElement.querySelectorAll('.text-message');
            textMessages.forEach(textMessage => {
                this.fixMobileTextMessage(textMessage);
            });

        } catch (error) {
            console.warn('MobileTextFix: 修复移动端消息时出错', error);
        }
    }

    fixMobileTextMessage(textMessage) {
        const mobileStyles = {
            maxHeight: 'none',
            height: 'auto',
            minHeight: 'auto',
            overflow: 'visible',
            overflowX: 'visible',
            overflowY: 'visible',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
            webkitHyphens: 'auto',
            mozHyphens: 'auto',
            hyphens: 'auto',
            whiteSpace: textMessage.classList.contains('markdown-rendered') ? 'normal' : 'pre-wrap'
        };

        // 小屏幕特殊处理
        if (this.isSmallScreen) {
            mobileStyles.fontSize = '0.9rem';
            mobileStyles.lineHeight = '1.4';
        }

        this.applyMobileStyles(textMessage, mobileStyles);

        // 特别处理链接
        const links = textMessage.querySelectorAll('a');
        links.forEach(link => {
            this.applyMobileStyles(link, {
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                whiteSpace: 'normal',
                fontSize: this.isSmallScreen ? '0.85rem' : 'inherit'
            });
        });

        // 特别处理长单词
        this.breakLongWords(textMessage);

        // 检查并修复溢出
        this.checkMobileOverflow(textMessage);
    }

    breakLongWords(textMessage) {
        // 查找并处理超长单词
        const walker = document.createTreeWalker(
            textMessage,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const words = text.split(/(\s+)/);
            let hasLongWord = false;

            words.forEach(word => {
                // 如果单词长度超过屏幕宽度的字符估算值
                const maxLength = Math.floor(window.innerWidth / 12); // 粗略估算
                if (word.length > maxLength && !/\s/.test(word)) {
                    hasLongWord = true;
                }
            });

            if (hasLongWord) {
                // 为包含长单词的文本节点的父元素添加特殊样式
                let parent = textNode.parentElement;
                while (parent && !parent.classList.contains('text-message')) {
                    parent = parent.parentElement;
                }
                if (parent) {
                    this.applyMobileStyles(parent, {
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere'
                    });
                }
            }
        });
    }

    checkMobileOverflow(textMessage) {
        // 移动端溢出检查
        if (textMessage.scrollHeight > textMessage.clientHeight + 5) { // 5px 容差
            console.warn('MobileTextFix: 检测到移动端文本溢出', {
                element: textMessage,
                scrollHeight: textMessage.scrollHeight,
                clientHeight: textMessage.clientHeight
            });

            // 强制修复
            this.applyMobileStyles(textMessage, {
                height: 'auto',
                minHeight: textMessage.scrollHeight + 'px',
                overflow: 'visible'
            });

            // 重置高度
            setTimeout(() => {
                this.applyMobileStyles(textMessage, {
                    height: 'auto',
                    minHeight: 'auto'
                });
            }, 100);
        }
    }

    applyMobileStyles(element, styles) {
        Object.entries(styles).forEach(([property, value]) => {
            try {
                const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
                element.style.setProperty(cssProperty, value, 'important');
            } catch (error) {
                console.warn(`MobileTextFix: 设置移动端样式 ${property} 失败`, error);
            }
        });
    }

    // 获取移动端诊断信息
    getMobileDiagnostics() {
        const messages = document.querySelectorAll('.message');
        const diagnostics = {
            deviceInfo: {
                isMobile: this.isMobile,
                isSmallScreen: this.isSmallScreen,
                screenSize: `${window.innerWidth}×${window.innerHeight}`,
                userAgent: navigator.userAgent,
                devicePixelRatio: window.devicePixelRatio
            },
            messages: []
        };

        messages.forEach((message, index) => {
            const textMessage = message.querySelector('.text-message');
            if (textMessage) {
                const rect = textMessage.getBoundingClientRect();
                const style = window.getComputedStyle(textMessage);
                
                diagnostics.messages.push({
                    index: index + 1,
                    messageId: message.dataset.messageId || 'unknown',
                    dimensions: {
                        width: rect.width,
                        height: rect.height,
                        scrollHeight: textMessage.scrollHeight,
                        clientHeight: textMessage.clientHeight
                    },
                    isOverflowing: textMessage.scrollHeight > textMessage.clientHeight,
                    styles: {
                        wordBreak: style.wordBreak,
                        overflowWrap: style.overflowWrap,
                        overflow: style.overflow,
                        maxHeight: style.maxHeight,
                        fontSize: style.fontSize
                    },
                    content: textMessage.textContent.substring(0, 50) + '...'
                });
            }
        });

        return diagnostics;
    }
}

// 创建移动端修复实例
if (typeof window !== 'undefined') {
    window.MobileTextFix = new MobileTextFix();
    
    // 提供调试方法
    window.getMobileDiagnostics = () => {
        if (window.MobileTextFix) {
            const diagnostics = window.MobileTextFix.getMobileDiagnostics();
            console.log('移动端诊断信息:', diagnostics);
            return diagnostics;
        }
        return null;
    };

    window.fixMobileText = () => {
        if (window.MobileTextFix) {
            window.MobileTextFix.applyMobileFixes();
            console.log('移动端手动修复完成');
        }
    };

    console.log('MobileTextFix: 移动端长文本修复脚本已加载');
}
