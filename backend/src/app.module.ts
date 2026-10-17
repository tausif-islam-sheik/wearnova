import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { ThrottlerConfigModule } from './config/throttler.config';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigSchema } from './config/config.schema';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OffersModule } from './modules/offers/offers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BrandsModule } from './modules/brands/brands.module';
import { PromosModule } from './modules/promos/promos.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { AuditModule } from './modules/audit/audit.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { BackupsModule } from './modules/backups/backups.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BannersModule } from './modules/banners/banners.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: ConfigSchema,
      validationOptions: { abortEarly: true },
    }),
    AppConfigModule,
    ThrottlerConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    CategoriesModule,
    OrdersModule,
    OffersModule,
    ReviewsModule,
    ConversationsModule,
    MessagesModule,
    FavoritesModule,
    ReportsModule,
    PromosModule,
    DisputesModule,
    AuditModule,
    InventoryModule,
    BackupsModule,
    BrandsModule,
    TransactionsModule,
    BannersModule,
    StripeModule,
    UploadModule,
    AdminModule,
    QuestionsModule,
    AddressesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
