import Toast from 'typescript-toastify';
import type { ToastType } from 'typescript-toastify/lib/type/type';

export function toast(type: ToastType, toastMsg: string) {
  new Toast({
    position: 'top-right',
    toastMsg,
    autoCloseTime: type === 'error' ? 0 : 4500,
    canClose: true,
    showProgress: true,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    type,
    theme: 'light',
  });
}
