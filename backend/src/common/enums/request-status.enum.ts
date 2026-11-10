export enum RequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export const REQUEST_STATUS_VALUES = Object.values(RequestStatus);
