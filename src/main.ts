import IMask from 'imask';

import { Contact } from '@models/Contact';
import { Group } from '@models/Group';
import { StorageService } from '@services/StorageService';
import { ToastService } from '@services/ToastService';
import { Dropdown } from '@components/Dropdown';
import { ConfirmPopup } from '@ui/ConfirmPopup';

interface AppState {
  contacts: Contact[];
  groups: Group[];
}

const DEFAULT_GROUPS = ['Друзья', 'Работа', 'Семья'];

class ContactApp {
  private state: AppState;
  private readonly contactsList: HTMLElement;
  private readonly contactsEmpty: HTMLElement;
  private readonly searchInput: HTMLInputElement;
  private readonly addContactButton: HTMLButtonElement;

  private readonly formElement: HTMLFormElement;
  private readonly formTitle: HTMLElement;
  private readonly formIdInput: HTMLInputElement;
  private readonly nameInput: HTMLInputElement;
  private readonly phoneInput: HTMLInputElement;

  private readonly groupList: HTMLElement;
  private readonly groupForm: HTMLFormElement;
  private readonly groupInput: HTMLInputElement;

  private readonly dropdown: Dropdown;
  private readonly contactSheetDropdown: Dropdown;
  private readonly contactSheetDropdownRoot: HTMLElement;
  private readonly toastService: ToastService;
  private readonly confirmPopup: ConfirmPopup;

  private readonly groupsSheet: HTMLElement;
  private readonly groupsSheetOpenButton: HTMLButtonElement;
  private readonly groupsSheetCloseButton: HTMLButtonElement | null;
  private readonly groupsSheetBackdrop: HTMLElement | null;
  private readonly groupsSheetAddButton: HTMLButtonElement | null;
  private readonly groupFormClearButton: HTMLButtonElement | null;
  private readonly groupsSheetSaveButton: HTMLButtonElement | null;

  private readonly contactSheet: HTMLElement;
  private readonly contactSheetOpenButton: HTMLButtonElement;
  private readonly contactSheetMobileOpenButton: HTMLButtonElement | null;
  private readonly contactSheetCloseButton: HTMLButtonElement | null;
  private readonly contactSheetBackdrop: HTMLElement | null;
  private readonly contactSheetForm: HTMLFormElement;
  private readonly contactSheetNameInput: HTMLInputElement;
  private readonly contactSheetPhoneInput: HTMLInputElement;
  private readonly contactSheetGroupSelect: HTMLSelectElement;

  private contactSheetEditingId: string | null = null;
  private openMainGroupIds: Set<string> = new Set();

  constructor() {
    const persisted = StorageService.load();
    const groups =
      persisted.groups.length > 0
        ? persisted.groups.map((g) => new Group(g))
        : DEFAULT_GROUPS.map(
            (name) =>
              new Group({
                id: crypto.randomUUID(),
                name
              })
          );

    this.state = {
      contacts: persisted.contacts.map((c) => new Contact(c)),
      groups
    };

    this.contactsList = this.getRequiredElement<HTMLElement>('[data-contact-list]');
    this.contactsEmpty = this.getRequiredElement<HTMLElement>('[data-contact-empty]');
    this.searchInput = this.getRequiredElement<HTMLInputElement>('#contacts-search');
    this.addContactButton = this.getRequiredElement<HTMLButtonElement>('.contacts__add-button');

    this.formElement = this.getRequiredElement<HTMLFormElement>('[data-contact-form-element]');
    this.formTitle = this.getRequiredElement<HTMLElement>('[data-contact-form-title]');
    this.formIdInput = this.getRequiredElement<HTMLInputElement>('[data-contact-id]');
    this.nameInput = this.getRequiredElement<HTMLInputElement>('#contact-name');
    this.phoneInput = this.getRequiredElement<HTMLInputElement>('#contact-phone');

    this.groupList = this.getRequiredElement<HTMLElement>('[data-group-list]');
    this.groupForm = this.getRequiredElement<HTMLFormElement>('[data-group-form]');
    this.groupInput = this.getRequiredElement<HTMLInputElement>('#group-name');

    const dropdownRoot = this.getRequiredElement<HTMLElement>('[data-group-dropdown]');
    this.dropdown = new Dropdown(dropdownRoot);

    const contactSheetDropdownRoot =
      this.getRequiredElement<HTMLElement>('[data-contact-sheet-dropdown]');
    this.contactSheetDropdownRoot = contactSheetDropdownRoot;
    this.contactSheetDropdown = new Dropdown(contactSheetDropdownRoot);

    const toasterRoot = this.getRequiredElement<HTMLElement>('[data-toaster]');
    this.toastService = new ToastService(toasterRoot);

    const popupRoot = this.getRequiredElement<HTMLElement>('[data-confirm-popup]');
    this.confirmPopup = new ConfirmPopup(popupRoot);

    this.groupsSheet = this.getRequiredElement<HTMLElement>('[data-groups-sheet]');
    this.groupsSheetOpenButton = this.getRequiredElement<HTMLButtonElement>(
      '.page-header__button--groups'
    );
    this.groupsSheetCloseButton = document.querySelector<HTMLButtonElement>(
      '[data-groups-sheet-close]'
    );
    this.groupsSheetBackdrop = document.querySelector<HTMLElement>('[data-groups-sheet-backdrop]');
    this.groupsSheetAddButton = document.querySelector<HTMLButtonElement>('[data-groups-sheet-add]');
    this.groupFormClearButton = document.querySelector<HTMLButtonElement>('[data-group-form-clear]');
    this.groupsSheetSaveButton = document.querySelector<HTMLButtonElement>('[data-groups-sheet-save]');

    this.contactSheet = this.getRequiredElement<HTMLElement>('[data-contact-sheet]');
    this.contactSheetOpenButton = this.getRequiredElement<HTMLButtonElement>(
      '.page-header__button--add'
    );
    this.contactSheetMobileOpenButton = document.querySelector<HTMLButtonElement>(
      '.page-header__button--add-mobile'
    );
    this.contactSheetCloseButton = document.querySelector<HTMLButtonElement>(
      '[data-contact-sheet-close]'
    );
    this.contactSheetBackdrop =
      document.querySelector<HTMLElement>('[data-contact-sheet-backdrop]');
    this.contactSheetForm =
      this.getRequiredElement<HTMLFormElement>('[data-contact-sheet-form]');
    this.contactSheetNameInput =
      this.getRequiredElement<HTMLInputElement>('#contact-sheet-name');
    this.contactSheetPhoneInput =
      this.getRequiredElement<HTMLInputElement>('#contact-sheet-phone');

    this.attachListeners();
    this.updateDropdownItems();
    this.renderGroups();
    this.renderContacts();
    this.setupPhoneMask();
    this.updateEmptyState();
  }

  private getRequiredElement<T extends Element>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (!el) {
      throw new Error(`Element not found: "${selector}"`);
    }
    return el;
  }

  private attachListeners(): void {
    this.formElement.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleFormSubmit();
    });

    const resetButton = document.querySelector<HTMLButtonElement>('[data-contact-form-reset]');
    resetButton?.addEventListener('click', () => this.resetForm());

    this.groupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleGroupCreate();
    });

    this.groupInput.addEventListener('input', () => {
      const field = this.groupInput.closest<HTMLElement>('.field');
      if (this.groupInput.value.trim()) {
        field?.classList.remove('field--invalid');
      }
    });

    this.contactSheetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleContactSheetSubmit();
    });

    this.searchInput.addEventListener('input', () => {
      this.renderContacts();
    });

    this.addContactButton.addEventListener('click', () => {
      this.resetForm();
      this.nameInput.focus();
    });

    this.groupsSheetOpenButton.addEventListener('click', () => {
      this.openGroupsSheet();
    });

    this.groupsSheetCloseButton?.addEventListener('click', () => {
      this.closeGroupsSheet();
    });

    this.groupsSheetBackdrop?.addEventListener('click', () => {
      this.closeGroupsSheet();
    });

    this.groupsSheetAddButton?.addEventListener('click', () => {
      this.showGroupsForm();
    });

    this.groupFormClearButton?.addEventListener('click', () => {
      this.groupInput.value = '';
      this.groupsSheet.classList.remove('groups-sheet--form-visible');
    });

    this.groupsSheetSaveButton?.addEventListener('click', () => {
      const name = this.groupInput.value.trim();
      const field = this.groupInput.closest<HTMLElement>('.field');
      if (!name) {
        field?.classList.add('field--invalid');
        return;
      }
      field?.classList.remove('field--invalid');
      this.groupForm.requestSubmit();
      this.groupsSheet.classList.remove('groups-sheet--form-visible');
    });

    this.contactSheetOpenButton.addEventListener('click', () => {
      this.openContactSheet();
    });

    this.contactSheetMobileOpenButton?.addEventListener('click', () => {
      this.openContactSheet();
    });

    this.contactSheetCloseButton?.addEventListener('click', () => {
      this.closeContactSheet();
    });

    this.contactSheetBackdrop?.addEventListener('click', () => {
      this.closeContactSheet();
    });
  }

  private openGroupsSheet(): void {
    this.groupsSheet.classList.add('groups-sheet--open');
  }

  private closeGroupsSheet(): void {
    this.groupsSheet.classList.remove('groups-sheet--open');
  }

  private showGroupsForm(): void {
    this.groupsSheet.classList.add('groups-sheet--form-visible');
    this.groupInput.value = '';
    this.groupInput.focus();
  }

  private openContactSheet(): void {
    this.contactSheet.classList.add('contact-sheet--open');
    this.resetContactSheetForm();
    this.contactSheetEditingId = null;
  }

  private closeContactSheet(): void {
    this.contactSheet.classList.remove('contact-sheet--open');
  }

  private setupPhoneMask(): void {
    const maskOptions = {
      mask: '+{7} (000) 000-00-00'
    } as const;

    IMask(this.phoneInput, maskOptions);
    IMask(this.contactSheetPhoneInput, maskOptions);
  }

  private handleFormSubmit(): void {
    const name = this.nameInput.value.trim();
    const phone = this.phoneInput.value.trim();
    const groupId = this.dropdown.value;

    if (!name || !phone || !groupId) {
      this.toastService.show({
        kind: 'error',
        message: 'Имя, телефон и группа обязательны для заполнения.'
      });
      return;
    }

    const existingByPhone = this.state.contacts.find((contact) => contact.phone === phone);
    const editingId = this.formIdInput.value || null;

    if (existingByPhone && existingByPhone.id !== editingId) {
      this.toastService.show({
        kind: 'error',
        message: 'Контакт с таким номером телефона уже существует.'
      });
      return;
    }

    if (editingId) {
      this.updateContact(editingId, { name, phone, groupId });
    } else {
      this.createContact({ name, phone, groupId });
    }

    this.resetForm();
    this.renderContacts();
    this.renderGroups();
    this.persist();
    this.updateEmptyState();
  }

  private createContact(params: { name: string; phone: string; groupId: string }): void {
    const contact = new Contact({
      id: crypto.randomUUID(),
      name: params.name,
      phone: params.phone,
      groupId: params.groupId
    });

    this.state.contacts = [contact, ...this.state.contacts];
    this.toastService.show({
      kind: 'success',
      message: 'Контакт успешно добавлен в список.'
    });
  }

  private updateContact(
    id: string,
    params: { name: string; phone: string; groupId: string }
  ): void {
    this.state.contacts = this.state.contacts.map((contact) =>
      contact.id === id
        ? new Contact({
            id,
            name: params.name,
            phone: params.phone,
            groupId: params.groupId
          })
        : contact
    );

    this.toastService.show({
      kind: 'success',
      message: 'Изменения контакта успешно сохранены.'
    });
  }

  private deleteContact(id: string): void {
    this.state.contacts = this.state.contacts.filter((contact) => contact.id !== id);

    this.toastService.show({
      kind: 'info',
      message: 'Контакт был удалён из списка.'
    });

    this.renderContacts();
    this.renderGroups();
    this.persist();
    this.updateEmptyState();
  }

  private handleGroupCreate(): void {
    const name = this.groupInput.value.trim();
    if (!name) {
      const field = this.groupInput.closest<HTMLElement>('.field');
      field?.classList.add('field--invalid');
      return;
    }

    const field = this.groupInput.closest<HTMLElement>('.field');
    field?.classList.remove('field--invalid');

    const exists = this.state.groups.some(
      (group) => group.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      this.toastService.show({
        kind: 'error',
        message: 'Нельзя создать две группы с одинаковым названием.'
      });
      return;
    }

    const group = new Group({
      id: crypto.randomUUID(),
      name
    });

    this.state.groups = [...this.state.groups, group];
    this.groupInput.value = '';

    this.toastService.show({
      kind: 'success',
      message: 'Новая группа успешно добавлена.'
    });

    this.updateDropdownItems();
    this.renderGroups();
    this.persist();
    this.updateEmptyState();
  }

  private handleGroupDelete(id: string): void {
    const group = this.state.groups.find((item) => item.id === id);
    if (!group) return;

    this.confirmPopup.open(() => {
      this.state.groups = this.state.groups.filter((g) => g.id !== id);
      this.state.contacts = this.state.contacts.filter((contact) => contact.groupId !== id);

      this.toastService.show({
        kind: 'info',
        message: 'Группа и все вложенные контакты были успешно удалены.'
      });

      this.updateDropdownItems();
      this.renderGroups();
      this.renderContacts();
      this.persist();
      this.updateEmptyState();
    });
  }

  private handleContactSheetSubmit(): void {
    const name = this.contactSheetNameInput.value.trim();
    const phone = this.contactSheetPhoneInput.value.trim();
    const groupId = this.contactSheetDropdown.value ?? '';

    this.setContactSheetFieldError(this.contactSheetNameInput, !name);
    this.setContactSheetFieldError(this.contactSheetPhoneInput, !phone);
    this.setContactSheetFieldError(this.contactSheetDropdownRoot, !groupId);

    if (!name || !phone || !groupId) {
      this.toastService.show({
        kind: 'error',
        message: 'Имя, телефон и группа обязательны для заполнения.'
      });
      return;
    }

    const existingByPhone = this.state.contacts.find(
      (contact) => contact.phone === phone
    );
    if (existingByPhone && existingByPhone.id !== this.contactSheetEditingId) {
      this.toastService.show({
        kind: 'error',
        message: 'Контакт с таким номером телефона уже существует.'
      });
      return;
    }

    if (this.contactSheetEditingId) {
      this.state.contacts = this.state.contacts.map((contact) =>
        contact.id === this.contactSheetEditingId
          ? new Contact({
              id: this.contactSheetEditingId!,
              name,
              phone,
              groupId
            })
          : contact
      );

      this.toastService.show({
        kind: 'success',
        message: 'Изменения контакта успешно сохранены.'
      });
    } else {
      const contact = new Contact({
        id: crypto.randomUUID(),
        name,
        phone,
        groupId
      });

      this.state.contacts = [contact, ...this.state.contacts];

      this.toastService.show({
        kind: 'success',
        message: 'Контакт успешно добавлен в список.'
      });
    }

    this.resetContactSheetForm();
    this.contactSheetEditingId = null;

    this.renderContacts();
    this.renderGroups();
    this.persist();
    this.closeContactSheet();
    this.updateEmptyState();
  }


  private editContactInSheet(contact: Contact): void {
    this.contactSheetEditingId = contact.id;
    this.contactSheet.classList.add('contact-sheet--open');

    this.contactSheetNameInput.value = contact.name;
    this.contactSheetPhoneInput.value = contact.phone;
    this.contactSheetDropdown.value = contact.groupId;

    const fields =
      this.contactSheetForm.querySelectorAll<HTMLElement>('.contact-sheet__field');
    fields.forEach((field) =>
      field.classList.remove('contact-sheet__field--invalid')
    );
  }

  private resetContactSheetForm(): void {
    this.contactSheetForm.reset();
    this.contactSheetDropdown.value = null;
    const fields =
      this.contactSheetForm.querySelectorAll<HTMLElement>('.contact-sheet__field');
    fields.forEach((field) =>
      field.classList.remove('contact-sheet__field--invalid')
    );
  }

  private setContactSheetFieldError(element: Element, hasError: boolean): void {
    const field = element.closest<HTMLElement>('.contact-sheet__field');
    if (!field) return;
    field.classList.toggle('contact-sheet__field--invalid', hasError);
  }

  private resetForm(): void {
    this.formElement.reset();
    this.formIdInput.value = '';
    this.formTitle.textContent = 'Новый контакт';
  }

  private editContact(contact: Contact): void {
    this.formIdInput.value = contact.id;
    this.formTitle.textContent = 'Редактирование контакта';
    this.nameInput.value = contact.name;
    this.phoneInput.value = contact.phone;
    this.dropdown.value = contact.groupId;
    this.nameInput.focus();
  }

  private renderContacts(): void {
    const search = this.searchInput.value.trim().toLowerCase();
    const filtered = this.state.contacts.filter((contact) => {
      const matchesSearch =
        !search ||
        contact.name.toLowerCase().includes(search) ||
        contact.phone.toLowerCase().includes(search);
      return matchesSearch;
    });

    this.contactsList.innerHTML = '';
    this.contactsEmpty.style.display = filtered.length === 0 ? 'block' : 'none';

    for (const contact of filtered) {
      const group = this.state.groups.find((g) => g.id === contact.groupId);
      const item = document.createElement('article');
      item.className = 'contact-item';

      const main = document.createElement('div');
      main.className = 'contact-item__main';

      const name = document.createElement('div');
      name.className = 'contact-item__name';
      name.textContent = contact.name;

      const phone = document.createElement('div');
      phone.className = 'contact-item__phone';
      phone.textContent = contact.phone;

      main.append(name, phone);

      const meta = document.createElement('div');
      meta.className = 'contact-item__meta';

      if (group) {
        const groupPill = document.createElement('span');
        groupPill.className = 'contact-item__group-pill';
        groupPill.textContent = group.name;
        meta.appendChild(groupPill);
      }

      const actions = document.createElement('div');
      actions.className = 'contact-item__actions';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'button button--ghost';
      editButton.textContent = 'Изменить';
      editButton.addEventListener('click', () => this.editContact(contact));

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button button--ghost';
      deleteButton.textContent = 'Удалить';
      deleteButton.addEventListener('click', () => this.deleteContact(contact.id));

      actions.append(editButton, deleteButton);

      item.append(main, meta, actions);
      this.contactsList.appendChild(item);
    }
  }

  private renderGroups(): void {
    this.groupList.innerHTML = '';

    const mainGroupList =
      document.querySelector<HTMLElement>('[data-main-group-list]');
    if (mainGroupList) {
      mainGroupList.innerHTML = '';
    }

    for (const group of this.state.groups) {
      const li = document.createElement('li');
      li.className = 'groups__item';

      const name = document.createElement('span');
      name.className = 'groups__name';
      name.textContent = group.name;

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.alignItems = 'center';
      right.style.gap = '0.35rem';

      const badge = document.createElement('span');
      badge.className = 'groups__badge';
      const count = this.state.contacts.filter((contact) => contact.groupId === group.id).length;
      badge.textContent = String(count);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button button--icon';
      deleteButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none"><g clip-path="url(#a)"><path fill="currentColor" d="M6.333 20.056c0 1.16.95 2.11 2.111 2.11h8.445c1.161 0 2.111-.95 2.111-2.11V7.388H6.333zM8.93 12.54l1.488-1.488 2.249 2.237 2.238-2.237 1.488 1.488-2.238 2.238 2.238 2.237-1.489 1.489-2.237-2.238-2.238 2.238-1.488-1.489 2.237-2.237zm7.431-8.318-1.055-1.055h-5.278L8.972 4.222H5.278v2.111h14.778v-2.11z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h25.333v25.333H0z"/></clipPath></defs></svg><span class="visually-hidden">Удалить группу</span>';
      deleteButton.addEventListener('click', () => this.handleGroupDelete(group.id));

      right.append(badge, deleteButton);
      li.append(name, right);
      this.groupList.appendChild(li);

      if (mainGroupList) {
        const mainLi = document.createElement('li');
        mainLi.className = 'groups-main__item';

      const header = document.createElement('div');
      header.className = 'groups-main__header';
      const headerName = document.createElement('span');
      headerName.className = 'groups-main__title';
      headerName.textContent = group.name;
      const headerArrow = document.createElement('span');
      headerArrow.className = 'groups-main__arrow';
      headerArrow.innerHTML =
        '<img src="images/arrow.svg" width="24" height="24" alt="" />';
      header.append(headerName, headerArrow);

        const contactsInGroup = this.state.contacts.filter(
          (contact) => contact.groupId === group.id
        );

        const contactsContainer = document.createElement('div');
        contactsContainer.className = 'groups-main__contacts';

        for (const contact of contactsInGroup) {
          const row = document.createElement('div');
          row.className = 'groups-main__contact-row';

          const nameEl = document.createElement('span');
          nameEl.className = 'groups-main__contact-name';
          nameEl.textContent = contact.name;

          const phoneEl = document.createElement('span');
          phoneEl.className = 'groups-main__contact-phone';
          phoneEl.textContent = contact.phone;

          const actions = document.createElement('div');
          actions.className = 'groups-main__contact-actions';

          const editButton = document.createElement('button');
          editButton.type = 'button';
          editButton.className = 'button button--icon groups-main__contact-action';
          editButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><g clip-path="url(#a)"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></svg><span class="visually-hidden">Редактировать контакт</span>';
          editButton.addEventListener('click', () =>
            this.editContactInSheet(contact)
          );

          const deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.className =
            'button button--icon groups-main__contact-action groups-main__contact-action--danger';
          deleteButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none"><g clip-path="url(#a)"><path fill="currentColor" d="M6.333 20.056c0 1.16.95 2.11 2.111 2.11h8.445c1.161 0 2.111-.95 2.111-2.11V7.388H6.333zM8.93 12.54l1.488-1.488 2.249 2.237 2.238-2.237 1.488 1.488-2.238 2.238 2.238 2.237-1.489 1.489-2.237-2.238-2.238 2.238-1.488-1.489 2.237-2.237zm7.431-8.318-1.055-1.055h-5.278L8.972 4.222H5.278v2.111h14.778v-2.11z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h25.333v25.333H0z"/></clipPath></defs></svg><span class="visually-hidden">Удалить контакт</span>';
          deleteButton.addEventListener('click', () => this.deleteContact(contact.id));

          actions.append(editButton, deleteButton);

          const right = document.createElement('div');
          right.className = 'groups-main__contact-right';
          right.append(phoneEl, actions);

          row.append(nameEl, right);
          contactsContainer.appendChild(row);
        }

        // На главной показываем только группы, в которых есть хотя бы один контакт
        if (contactsInGroup.length > 0) {
          mainLi.append(header, contactsContainer);

          if (this.openMainGroupIds.has(group.id)) {
            mainLi.classList.add('groups-main__item--open');
          }

          header.addEventListener('click', () => {
            const isOpen = mainLi.classList.toggle('groups-main__item--open');
            if (isOpen) {
              this.openMainGroupIds.add(group.id);
            } else {
              this.openMainGroupIds.delete(group.id);
            }
          });

          mainGroupList.appendChild(mainLi);
        } else {
          this.openMainGroupIds.delete(group.id);
        }
      }
    }
  }

  private updateDropdownItems(): void {
    this.dropdown.dataItems = this.state.groups.map((group) => ({
      id: group.id,
      label: group.name
    }));

    this.updateContactSheetGroupOptions();
  }

  private updateContactSheetGroupOptions(): void {
    this.contactSheetDropdown.dataItems = this.state.groups.map((group) => ({
      id: group.id,
      label: group.name
    }));
  }

  private updateEmptyState(): void {
    const hasContacts = this.state.contacts.length > 0;

    const groupsPanel = document.querySelector<HTMLElement>('[data-main-group-panel]');
    const mainEmpty = document.querySelector<HTMLElement>('[data-main-empty]');

    if (groupsPanel) {
      groupsPanel.style.display = hasContacts ? 'block' : 'none';
    }

    if (mainEmpty) {
      mainEmpty.style.display = hasContacts ? 'none' : 'block';
    }
  }

  private persist(): void {
    StorageService.save({
      contacts: this.state.contacts,
      groups: this.state.groups
    });
  }
}

declare global {
  interface Window {
    contactApp?: ContactApp;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.contactApp = new ContactApp();
});

