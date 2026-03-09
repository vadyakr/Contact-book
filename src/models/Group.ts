export type GroupId = string;

export interface GroupProps {
  id: GroupId;
  name: string;
}

export class Group {
  readonly id: GroupId;
  name: string;

  constructor(props: GroupProps) {
    this.id = props.id;
    this.name = props.name.trim();
  }
}

