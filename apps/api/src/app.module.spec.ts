import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

/**
 * Smoke test that validates the entire dependency-injection graph resolves
 * (every controller/provider across all feature modules can be constructed).
 * It compiles the module without calling init(), so no database or Redis
 * connection is required.
 */
describe('AppModule', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  });

  it('compiles the dependency-injection graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
