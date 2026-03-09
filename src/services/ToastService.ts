type ToastKind = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  kind?: ToastKind;
  durationMs?: number;
}

export class ToastService {
  private readonly container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  show(options: ToastOptions): void {
    const toast = document.createElement('div');
    toast.className = `toast${
      options.kind === 'error' ? ' toast--error' : options.kind === 'success' ? ' toast--success' : ''
    }`;

    const content = document.createElement('div');
    content.className = 'toast__content';

    const text = document.createElement('div');
    text.className = 'toast__text';
    text.textContent = options.message;
    content.appendChild(text);

    let icon: HTMLElement | null = null;
    if (options.kind === 'success') {
      icon = document.createElement('div');
      icon.className = 'toast__icon toast__icon--success';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM11.0234 5.71406L7.73281 10.2766C7.68682 10.3408 7.62619 10.3931 7.55595 10.4291C7.48571 10.4652 7.40787 10.4841 7.32891 10.4841C7.24994 10.4841 7.17211 10.4652 7.10186 10.4291C7.03162 10.3931 6.97099 10.3408 6.925 10.2766L4.97656 7.57656C4.91719 7.49375 4.97656 7.37813 5.07812 7.37813H5.81094C5.97031 7.37813 6.12187 7.45469 6.21562 7.58594L7.32812 9.12969L9.78438 5.72344C9.87813 5.59375 10.0281 5.51562 10.1891 5.51562H10.9219C11.0234 5.51562 11.0828 5.63125 11.0234 5.71406Z" fill="#52C41A"/></svg>';
    }


    if (icon) {
      toast.append(icon, content);
    } else {
      toast.append(content);
    }
    this.container.appendChild(toast);

    const duration = options.durationMs ?? 3500;
    if (duration > 0) {
      window.setTimeout(() => this.removeToast(toast), duration);
    }
  }

  private removeToast(toast: HTMLElement): void {
    if (!toast.isConnected) return;

    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px) scale(0.97)';
    toast.addEventListener(
      'transitionend',
      () => {
        toast.remove();
      },
      { once: true }
    );
  }
}

