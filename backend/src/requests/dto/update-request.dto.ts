import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { RequestStatus } from '../../common/enums/request-status.enum';

export class UpdateRequestStatusDto {
  @IsNotEmpty()
  @IsEnum(RequestStatus, {
    message: 'status must be one of: Pending, Accepted, Rejected, Completed, Cancelled',
  })
  status: RequestStatus;
}

export class RescheduleRequestDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;
}
