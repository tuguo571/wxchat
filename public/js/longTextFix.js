/**
 * 长文本消息显示修复脚本
 * 用于动态检测和修复可能导致长文本显示不完全的问题
 */

class LongTextFix {
    constructor() {
        this.observer = null;
        this.fixedElements = new Set();
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        // 检测是否为移动设备
        const userAgent = navigator.userAgent;
        const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;

        return isMobileUA || (isTouchDevice && isSmallScreen);
    }

    init() {
        // 页面加载完成后开始监控
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
        } else {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        // 立即修复现有消息
        this.fixAllMessages();

        // 设置MutationObserver来监控新添加的消息
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.fixMessageElement(node);
                        }
                    });
                }
            });
        });

        // 开始观察消息列表的变化
        const messageList = document.querySelector('.message-list');
        if (messageList) {
            this.observer.observe(messageList, {
                childList: true,
                subtree: true
            });
        }

        // 定期检查（作为备用方案）
        setInterval(() => this.fixAllMessages(), 5000);
    }

    fixAllMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => this.fixMessageElement(message));
    }

    fixMessageElement(element) {
        // 检查是否是消息元素或包含消息元素
        const messages = element.classList && element.classList.contains('message') 
            ? [element] 
            : element.querySelectorAll ? element.querySelectorAll('.message') : [];

        messages.forEach(message => {
            const messageId = message.dataset.messageId || message.id || 'unknown';
            
            // 避免重复修复同一个元素
            if (this.fixedElements.has(messageId)) {
                return;
            }

            this.applyFixes(message);
            this.fixedElements.add(messageId);
        });
    }

    applyFixes(messageElement) {
        try {
            // 修复消息容器
            this.fixElementStyles(messageElement, {
                maxHeight: 'none',
                height: 'auto',
                minHeight: 'auto',
                overflow: 'visible',
                overflowX: 'visible',
                overflowY: 'visible',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: '0',
                flexGrow: '0'
            });

            // 修复消息内容容器
            const messageContent = messageElement.querySelector('.message-content');
            if (messageContent) {
                this.fixElementStyles(messageContent, {
                    maxHeight: 'none',
                    height: 'auto',
                    minHeight: 'auto',
                    overflow: 'visible',
                    overflowX: 'visible',
                    overflowY: 'visible',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    display: 'block',
                    flexShrink: '0',
                    flexGrow: '0'
                });
            }

            // 修复文本消息
            const textMessages = messageElement.querySelectorAll('.text-message');
            textMessages.forEach(textMessage => {
                this.fixElementStyles(textMessage, {
                    maxHeight: 'none',
                    height: 'auto',
                    minHeight: 'auto',
                    overflow: 'visible',
                    overflowX: 'visible',
                    overflowY: 'visible',
                    textOverflow: 'clip',
                    webkitLineClamp: 'none',
                    lineClamp: 'none',
                    webkitBoxOrient: 'unset',
                    display: 'block',
                    flexShrink: '0',
                    flexGrow: '0',
                    whiteSpace: textMessage.classList.contains('markdown-rendered') ? 'normal' : 'pre-wrap',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                });

                // 特别处理链接
                const links = textMessage.querySelectorAll('a');
                links.forEach(link => {
                    this.fixElementStyles(link, {
                        wordWrap: 'break-word',
                        wordBreak: 'break-all',
                        whiteSpace: 'normal',
                        overflowWrap: 'break-word',
                        hyphens: 'auto'
                    });
                });

                // 特别处理代码块
                const codeBlocks = textMessage.querySelectorAll('pre');
                codeBlocks.forEach(pre => {
                    this.fixElementStyles(pre, {
                        maxHeight: 'none',
                        height: 'auto',
                        overflowX: 'auto',
                        overflowY: 'visible',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                    });
                });

                // 特别处理行内代码
                const inlineCodes = textMessage.querySelectorAll('code');
                inlineCodes.forEach(code => {
                    if (!code.parentElement || code.parentElement.tagName !== 'PRE') {
                        this.fixElementStyles(code, {
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word'
                        });
                    }
                });
            });

            // 检查是否有溢出问题
            this.checkForOverflow(messageElement);

        } catch (error) {
            console.warn('LongTextFix: 修复消息元素时出错', error);
        }
    }

    fixElementStyles(element, styles) {
        Object.entries(styles).forEach(([property, value]) => {
            try {
                // 转换驼峰命名到CSS属性名
                const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
                element.style.setProperty(cssProperty, value, 'important');
            } catch (error) {
                console.warn(`LongTextFix: 设置样式 ${property} 失败`, error);
            }
        });
    }

    checkForOverflow(messageElement) {
        const textMessages = messageElement.querySelectorAll('.text-message');
        textMessages.forEach(textMessage => {
            if (textMessage.scrollHeight > textMessage.clientHeight) {
                console.warn('LongTextFix: 检测到文本溢出', {
                    element: textMessage,
                    scrollHeight: textMessage.scrollHeight,
                    clientHeight: textMessage.clientHeight,
                    content: textMessage.textContent.substring(0, 100) + '...'
                });

                // 强制修复溢出
                this.fixElementStyles(textMessage, {
                    height: textMessage.scrollHeight + 'px',
                    minHeight: textMessage.scrollHeight + 'px'
                });

                // 然后重置为auto，让内容自然展开
                setTimeout(() => {
                    this.fixElementStyles(textMessage, {
                        height: 'auto',
                        minHeight: 'auto'
                    });
                }, 100);
            }
        });
    }

    // 手动触发修复（用于调试）
    manualFix() {
        console.log('LongTextFix: 手动触发修复');
        this.fixedElements.clear();
        this.fixAllMessages();
    }

    // 停止监控
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    // 获取诊断信息
    getDiagnostics() {
        const messages = document.querySelectorAll('.message');
        const diagnostics = [];

        messages.forEach((message, index) => {
            const textMessage = message.querySelector('.text-message');
            if (textMessage) {
                const computedStyle = window.getComputedStyle(textMessage);
                diagnostics.push({
                    index: index + 1,
                    messageId: message.dataset.messageId || 'unknown',
                    scrollHeight: textMessage.scrollHeight,
                    clientHeight: textMessage.clientHeight,
                    offsetHeight: textMessage.offsetHeight,
                    isOverflowing: textMessage.scrollHeight > textMessage.clientHeight,
                    styles: {
                        maxHeight: computedStyle.maxHeight,
                        height: computedStyle.height,
                        overflow: computedStyle.overflow,
                        overflowY: computedStyle.overflowY,
                        whiteSpace: computedStyle.whiteSpace,
                        wordWrap: computedStyle.wordWrap,
                        wordBreak: computedStyle.wordBreak,
                        textOverflow: computedStyle.textOverflow,
                        webkitLineClamp: computedStyle.webkitLineClamp,
                        display: computedStyle.display
                    },
                    content: textMessage.textContent.substring(0, 50) + '...'
                });
            }
        });

        return diagnostics;
    }
}

// 创建全局实例
window.LongTextFix = new LongTextFix();

// 在控制台中提供调试方法
window.fixLongText = () => window.LongTextFix.manualFix();
window.getLongTextDiagnostics = () => {
    const diagnostics = window.LongTextFix.getDiagnostics();
    console.table(diagnostics);
    return diagnostics;
};

console.log('LongTextFix: 长文本修复脚本已加载');
console.log('调试命令: fixLongText() - 手动修复, getLongTextDiagnostics() - 获取诊断信息');
