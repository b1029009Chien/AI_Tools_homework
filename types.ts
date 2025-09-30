
export enum RequestType {
  VOLUNTEER = '志工人力',
  SUPPLY = '物資需求',
}

export enum RequestStatus {
  NEW = '待處理',
  IN_PROGRESS = '處理中',
  COMPLETED = '已完成',
}

export interface Request {
  id: string;
  type: RequestType;
  status: RequestStatus;
  contactPerson: string;
  contactPhone: string;
  address: string;
  description: string;
  createdAt: Date;
}
