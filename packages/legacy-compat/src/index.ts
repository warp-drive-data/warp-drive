/**
 * @summary Legacy entry re-exporting `LegacyNetworkHandler`, `adapterFor`, `serializerFor`, and related helpers that
 * let a request-based store keep using adapters and serializers.
 * @module
 * @mergeModuleWith <project>
 */
export {
  normalize,
  pushPayload,
  serializeRecord,
  cleanup,
  serializerFor,
  adapterFor,
  LegacyNetworkHandler,
  type MinimumAdapterInterface,
  type MinimumSerializerInterface,
  type SerializerOptions,
  type AdapterPayload,
  type LegacyStoreCompat,
  type CompatStore,
} from '@warp-drive/legacy/compat';
