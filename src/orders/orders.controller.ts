import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: "Order created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        subscriptionId: "507f1f77bcf86cd799439012",
        transactionId: "TXN_123456789",
        userId: "507f1f77bcf86cd799439013",
        price: 99.99,
        discount: 10.0,
        status: "pending",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all orders with optional filtering" })
  @ApiQuery({ name: "userId", required: false, description: "Filter by user ID", example: "507f1f77bcf86cd799439013" })
  @ApiQuery({
    name: "subscriptionId",
    required: false,
    description: "Filter by subscription ID",
    example: "507f1f77bcf86cd799439012",
  })
  @ApiQuery({ name: "status", required: false, description: "Filter by order status", example: "completed" })
  @ApiResponse({
    status: 200,
    description: "List of orders retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          subscriptionId: {
            _id: "507f1f77bcf86cd799439012",
            title: "Premium Student Plan",
            pricing: 99.99,
          },
          transactionId: "TXN_123456789",
          userId: {
            _id: "507f1f77bcf86cd799439013",
            name: "John Doe",
            email: "john.doe@example.com",
          },
          price: 99.99,
          discount: 10.0,
          status: "completed",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll(
    @Query("userId") userId?: string,
    @Query("subscriptionId") subscriptionId?: string,
    @Query("status") status?: string
  ) {
    if (userId) {
      return this.ordersService.findByUserId(userId);
    }
    if (subscriptionId) {
      return this.ordersService.findBySubscriptionId(subscriptionId);
    }
    if (status) {
      return this.ordersService.findByStatus(status);
    }
    return this.ordersService.findAll();
  }

  @Get("transaction/:transactionId")
  @ApiOperation({ summary: "Get order by transaction ID" })
  @ApiParam({ name: "transactionId", description: "Transaction ID", example: "TXN_123456789" })
  @ApiResponse({
    status: 200,
    description: "Order retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        subscriptionId: {
          _id: "507f1f77bcf86cd799439012",
          title: "Premium Student Plan",
        },
        transactionId: "TXN_123456789",
        userId: {
          _id: "507f1f77bcf86cd799439013",
          name: "John Doe",
        },
        price: 99.99,
        status: "completed",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  findByTransactionId(@Param("transactionId") transactionId: string) {
    return this.ordersService.findByTransactionId(transactionId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  @ApiParam({ name: "id", description: "Order ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Order retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        subscriptionId: {
          _id: "507f1f77bcf86cd799439012",
          title: "Premium Student Plan",
          pricing: 99.99,
        },
        transactionId: "TXN_123456789",
        userId: {
          _id: "507f1f77bcf86cd799439013",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        price: 99.99,
        discount: 10.0,
        status: "completed",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update order by ID" })
  @ApiParam({ name: "id", description: "Order ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    description: "Order updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        price: 89.99,
        discount: 15.0,
        status: "completed",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update order status" })
  @ApiParam({ name: "id", description: "Order ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({
    schema: { type: "object", properties: { status: { type: "string", enum: ["pending", "completed", "failed"] } } },
  })
  @ApiResponse({
    status: 200,
    description: "Order status updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        status: "completed",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 400, description: "Bad request - invalid status" })
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete order by ID" })
  @ApiParam({ name: "id", description: "Order ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Order deleted successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  remove(@Param("id") id: string) {
    return this.ordersService.remove(id);
  }
}
