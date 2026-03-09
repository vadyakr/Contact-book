type ConfirmHandler = () => void;

export class ConfirmPopup {
  private readonly root: HTMLElement;
  private readonly acceptButton: HTMLButtonElement;
  private readonly cancelButtons: HTMLButtonElement[];
  private readonly backdrop: HTMLElement;

  private onConfirm: ConfirmHandler | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    const accept = root.querySelector<HTMLButtonElement>('[data-confirm-popup-accept]');
    const cancelButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-confirm-popup-cancel]')
    );
    const backdrop = root.querySelector<HTMLElement>('[data-confirm-popup-backdrop]');

    if (!accept || cancelButtons.length === 0 || !backdrop) {
      throw new Error('ConfirmPopup: required elements are missing');
    }

    this.acceptButton = accept;
    this.cancelButtons = cancelButtons;
    this.backdrop = backdrop;

    this.handleAccept = this.handleAccept.bind(this);
    this.handleCancel = this.handleCancel.bind(this);

    this.acceptButton.addEventListener('click', this.handleAccept);
    this.cancelButtons.forEach((btn) =>
      btn.addEventListener('click', this.handleCancel)
    );
    this.backdrop.addEventListener('click', this.handleCancel);
  }

  open(onConfirm: ConfirmHandler): void {
    this.onConfirm = onConfirm;
    this.root.classList.add('popup--visible');
  }

  close(): void {
    this.root.classList.remove('popup--visible');
    this.onConfirm = null;
  }

  private handleAccept(): void {
    const handler = this.onConfirm;
    this.close();
    handler?.();
  }

  private handleCancel(): void {
    this.close();
  }
}

