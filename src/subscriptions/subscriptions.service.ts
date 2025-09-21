import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Subscription } from "./schemas/subscription.schema";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(@InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const createdSubscription = new this.subscriptionModel(createSubscriptionDto);
    return createdSubscription.save();
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionModel.find().exec();
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Subscription[]> {
    return this.subscriptionModel
      .find({
        pricing: { $gte: minPrice, $lte: maxPrice },
      })
      .exec();
  }

  async findByValidityDays(validForDays: number): Promise<Subscription[]> {
    return this.subscriptionModel.find({ validForDays }).exec();
  }

  async findActiveSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionModel.find({ validForDays: { $gt: 0 } }).exec();
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const updatedSubscription = await this.subscriptionModel
      .findByIdAndUpdate(id, updateSubscriptionDto, { new: true })
      .exec();
    if (!updatedSubscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return updatedSubscription;
  }

  async remove(id: string): Promise<void> {
    const result = await this.subscriptionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
  }
}
