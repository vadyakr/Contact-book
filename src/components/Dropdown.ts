type DropdownEventName = 'change' | 'open' | 'close';

export interface DropdownItem {
  id: string;
  label: string;
}

type Listener = (payload?: unknown) => void;

export class Dropdown {
  private readonly root: HTMLElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly labelElement: HTMLElement;
  private readonly listElement: HTMLElement;

  private isOpen = false;
  private items: DropdownItem[] = [];
  private selectedId: string | null = null;
  private listeners: Map<DropdownEventName, Set<Listener>> = new Map();

  constructor(root: HTMLElement) {
    this.root = root;

    const toggle = root.querySelector<HTMLButtonElement>('[data-dropdown-toggle]');
    const label = root.querySelector<HTMLElement>('[data-dropdown-label]');
    const list = root.querySelector<HTMLElement>('[data-dropdown-list]');

    if (!toggle || !label || !list) {
      throw new Error('Dropdown: required elements are missing');
    }

    this.toggleButton = toggle;
    this.labelElement = label;
    this.listElement = list;

    this.handleToggleClick = this.handleToggleClick.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);

    this.toggleButton.addEventListener('click', this.handleToggleClick);
  }

  bind(eventName: DropdownEventName, listener: Listener): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener);
  }

  get dataItems(): DropdownItem[] {
    return this.items;
  }

  set dataItems(items: DropdownItem[]) {
    this.items = items;
    this.renderItems();
  }

  get value(): string | null {
    return this.selectedId;
  }

  set value(id: string | null) {
    this.selectedId = id;
    this.syncSelectedLabel();
  }

  private emit(eventName: DropdownEventName, payload?: unknown): void {
    const targetListeners = this.listeners.get(eventName);
    if (!targetListeners) return;

    for (const listener of targetListeners) {
      listener(payload);
    }
  }

  private handleToggleClick(): void {
    this.isOpen ? this.close() : this.open();
  }

  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) return;

    if (!this.root.contains(target)) {
      this.close();
    }
  }

  private open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.root.classList.add('dropdown--open');
    document.addEventListener('click', this.handleDocumentClick);
    this.emit('open');
  }

  private close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.classList.remove('dropdown--open');
    document.removeEventListener('click', this.handleDocumentClick);
    this.emit('close');
  }

  private renderItems(): void {
    this.listElement.innerHTML = '';

    if (this.items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'dropdown__option';
      empty.textContent = 'Нет групп';
      empty.setAttribute('aria-disabled', 'true');
      this.listElement.appendChild(empty);
      this.labelElement.textContent = 'Нет групп';
      return;
    }

    for (const item of this.items) {
      const option = document.createElement('li');
      option.className = 'dropdown__option';
      option.dataset.value = item.id;
      option.textContent = item.label;

      if (item.id === this.selectedId) {
        option.classList.add('dropdown__option--selected');
      }

      option.addEventListener('click', () => {
        this.selectedId = item.id;
        this.syncSelectedLabel();
        this.emit('change', { id: item.id, label: item.label });
        this.close();
      });

      this.listElement.appendChild(option);
    }

    this.syncSelectedLabel();
  }

  private syncSelectedLabel(): void {
    if (!this.items.length || this.selectedId === null) {
      this.labelElement.textContent = 'Выберите группу';
      return;
    }

    const selected = this.items.find((item) => item.id === this.selectedId);
    if (!selected) {
      this.labelElement.textContent = 'Выберите группу';
      return;
    }

    this.labelElement.textContent = selected.label;

    const options = this.listElement.querySelectorAll<HTMLElement>('.dropdown__option');
    options.forEach((option) => {
      option.classList.toggle(
        'dropdown__option--selected',
        option.dataset.value === selected.id
      );
    });
  }
}

