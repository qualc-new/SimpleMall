import type { Config } from 'tailwindcss';

/**
 * SimpleMall Web 断点（桌面优先，max-width）
 * 默认 1920：无后缀类名
 * 与 .cursor/rules/web-responsive.mdc 保持一致
 */
const config: Config = {
  theme: {
    screens: {
      'bp-1440': { max: '1440px' },
      'bp-1366': { max: '1366px' },
      'bp-1280': { max: '1280px' },
      'bp-1024': { max: '1024px' },
      'bp-768': { max: '768px' },
      'bp-480': { max: '480px' },
      'bp-375': { max: '375px' },
    },
  },
};

export default config;
