export type ContactId = string;
export type GroupId = string;

export interface ContactProps {
  id: ContactId;
  name: string;
  phone: string;
  groupId: GroupId | null;
}

export class Contact {
  readonly id: ContactId;
  name: string;
  phone: string;
  groupId: GroupId | null;

  constructor(props: ContactProps) {
    this.id = props.id;
    this.name = props.name.trim();
    this.phone = props.phone.trim();
    this.groupId = props.groupId;
  }
}

