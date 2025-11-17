import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'ALER',
  webDir: 'www',
  server: {
    androidScheme: 'http'   // importante: http, NO https
  }
};

export default config;
