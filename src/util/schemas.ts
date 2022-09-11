import { IsOptional } from "class-validator";
export class ControllerDescriptor {
  name: string = null;

  @IsOptional()
  method: string;

  
}