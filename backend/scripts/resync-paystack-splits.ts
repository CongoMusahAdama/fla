import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const usersService = app.get(UsersService);
    const result = await usersService.resyncAllVendorPaystackSplits();
    console.log('\nPaystack split resync complete:\n', JSON.stringify(result, null, 2));
    if (result.failed.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Resync failed:', err?.message || err);
  process.exit(1);
});
