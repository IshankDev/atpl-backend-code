import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john.doe@example.com",
        phoneNumber: "+1234567890",
        imageUrl: "https://example.com/images/profile.jpg",
        role: "student",
        subscriptionDetail: {
          subscriptionId: "507f1f77bcf86cd799439012",
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-12-31T23:59:59.999Z",
        },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 409, description: "Conflict - email already exists" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({
    status: 200,
    description: "List of all users retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          name: "John Doe",
          email: "john.doe@example.com",
          role: "student",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiParam({ name: "id", description: "User ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "User retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john.doe@example.com",
        phoneNumber: "+1234567890",
        imageUrl: "https://example.com/images/profile.jpg",
        role: "student",
        subscriptionDetail: {
          subscriptionId: "507f1f77bcf86cd799439012",
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-12-31T23:59:59.999Z",
        },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user by ID" })
  @ApiParam({ name: "id", description: "User ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: "User updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        name: "John Doe Updated",
        email: "john.doe@example.com",
        role: "student",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete user by ID" })
  @ApiParam({ name: "id", description: "User ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
