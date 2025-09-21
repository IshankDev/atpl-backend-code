import { PartialType } from "@nestjs/mapped-types";
import { CreateMockTestResultDto } from "./create-mock-test-result.dto";

export class UpdateMockTestResultDto extends PartialType(CreateMockTestResultDto) {}
