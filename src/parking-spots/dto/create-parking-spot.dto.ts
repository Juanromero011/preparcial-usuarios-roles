
export class UpdateItemStatusDto {
  @IsEnum(ItemStatus)
  status: ItemStatus;
}

