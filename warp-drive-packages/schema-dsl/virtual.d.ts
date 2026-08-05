declare module 'virtual:warp-drive-schemas' {
  import { LegacyResourceSchema, PolarisResourceSchema } from '@warp-drive/core/types/schema/fields';
  const schemas: Array<LegacyResourceSchema | PolarisResourceSchema>;
  export default schemas;
}
