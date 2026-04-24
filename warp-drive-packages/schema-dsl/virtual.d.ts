declare module 'virtual:warp-drive-schemas' {
  import type { LegacyResourceSchema, ObjectSchema, PolarisResourceSchema, Trait } from '@warp-drive/core/types/schema/fields';
  const schemas: Array<LegacyResourceSchema | PolarisResourceSchema>;
  export default schemas;
  export const resources: Array<LegacyResourceSchema | PolarisResourceSchema>;
  export const objects: Array<ObjectSchema>;
  export const traits: Array<Trait>;
}
