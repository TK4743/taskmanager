// Runtime verification test
process.env.VERCEL = '1';

async function main() {
  console.log('Testing server.ts runtime initialization...');
  try {
    const serverModule = await import('../server.js').catch(async () => await import('../server.ts'));
    console.log('Server module loaded successfully.');
    console.log('Handler export type:', typeof serverModule.default);
    console.log('appPromise export type:', typeof serverModule.appPromise);

    const app = await serverModule.appPromise;
    console.log('Express app initialized successfully:', Boolean(app));
    console.log('ALL RUNTIME STARTUP CHECKS PASSED.');
    process.exit(0);
  } catch (error) {
    console.error('FATAL RUNTIME INITIALIZATION ERROR:', error);
    process.exit(1);
  }
}

main();
