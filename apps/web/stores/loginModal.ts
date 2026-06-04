import { defineStore } from 'pinia';

/** 登录态失效或未登录时展示的登录弹窗 */
export const useLoginModalStore = defineStore('loginModal', {
  state: () => ({
    visible: false,
    /** 登录成功后用于整页刷新前的目标路径（可选） */
    redirectPath: '' as string,
  }),
  actions: {
    open(redirectPath = '') {
      this.redirectPath = redirectPath;
      this.visible = true;
    },
    close() {
      this.visible = false;
      this.redirectPath = '';
    },
  },
});
