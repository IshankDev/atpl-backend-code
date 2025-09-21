import { PartialType } from "@nestjs/mapped-types";
import { CreateMockTestDto } from "./create-mock-test.dto";

export class UpdateMockTestDto extends PartialType(CreateMockTestDto) {}
