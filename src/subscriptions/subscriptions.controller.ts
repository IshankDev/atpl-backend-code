import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";

@ApiTags("Subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new subscription plan" })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: "Subscription created successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        title: "Premium Student Plan",
        pricing: 99.99,
        discount: 10.0,
        featureList: ["Unlimited access", "Premium content", "24/7 support"],
        validForDays: 365,
        description: "Comprehensive learning package with access to all courses and premium features",
        courseIds: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
        expirationDate: "2024-12-31T23:59:59.999Z",
        hasExpiration: true,
        bundleDiscount: 50.0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all subscriptions with optional filtering" })
  @ApiQuery({ name: "minPrice", required: false, description: "Minimum price filter", example: "50" })
  @ApiQuery({ name: "maxPrice", required: false, description: "Maximum price filter", example: "200" })
  @ApiQuery({ name: "validForDays", required: false, description: "Filter by validity days", example: "365" })
  @ApiResponse({
    status: 200,
    description: "List of subscriptions retrieved successfully",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Premium Student Plan",
          pricing: 99.99,
          discount: 10.0,
          featureList: ["Unlimited access", "Premium content"],
          validForDays: 365,
          description: "Comprehensive learning package",
          courseIds: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
          expirationDate: "2024-12-31T23:59:59.999Z",
          hasExpiration: true,
          bundleDiscount: 50.0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findAll(
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("validForDays") validForDays?: string
  ) {
    if (minPrice && maxPrice) {
      return this.subscriptionsService.findByPriceRange(Number(minPrice), Number(maxPrice));
    }
    if (validForDays) {
      return this.subscriptionsService.findByValidityDays(Number(validForDays));
    }
    return this.subscriptionsService.findAll();
  }

  @Get("active")
  @ApiOperation({ summary: "Get all active subscriptions (validity > 0 days)" })
  @ApiResponse({
    status: 200,
    description: "Active subscriptions retrieved successfully (validity > 0 days)",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          title: "Premium Student Plan",
          pricing: 99.99,
          discount: 10.0,
          featureList: ["Unlimited access", "Premium content"],
          validForDays: 365,
          description: "Comprehensive learning package",
          courseIds: ["507f1f77bcf86cd799439020"],
          expirationDate: "2024-12-31T23:59:59.999Z",
          hasExpiration: true,
          bundleDiscount: 50.0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  findActiveSubscriptions() {
    return this.subscriptionsService.findActiveSubscriptions();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get subscription by ID" })
  @ApiParam({ name: "id", description: "Subscription ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({
    status: 200,
    description: "Subscription retrieved successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        title: "Premium Student Plan",
        pricing: 99.99,
        discount: 10.0,
        featureList: ["Unlimited access", "Premium content", "24/7 support"],
        validForDays: 365,
        description: "Comprehensive learning package with access to all courses and premium features",
        courseIds: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
        expirationDate: "2024-12-31T23:59:59.999Z",
        hasExpiration: true,
        bundleDiscount: 50.0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  findOne(@Param("id") id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update subscription by ID" })
  @ApiParam({ name: "id", description: "Subscription ID", example: "507f1f77bcf86cd799439011" })
  @ApiBody({ type: UpdateSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: "Subscription updated successfully",
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        title: "Premium Student Plan Updated",
        pricing: 89.99,
        discount: 15.0,
        validForDays: 365,
        courseIds: ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
        expirationDate: "2024-12-31T23:59:59.999Z",
        hasExpiration: true,
        bundleDiscount: 50.0,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  update(@Param("id") id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete subscription by ID" })
  @ApiParam({ name: "id", description: "Subscription ID", example: "507f1f77bcf86cd799439011" })
  @ApiResponse({ status: 200, description: "Subscription deleted successfully" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  remove(@Param("id") id: string) {
    return this.subscriptionsService.remove(id);
  }
}
