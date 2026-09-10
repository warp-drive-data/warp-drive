/* oxlint-disable typescript/no-explicit-any */
import { assert } from '@warp-drive/core/build-config/macros';

import { initMeta } from './-private/storage-infra.ts';

/**
 * Configuration options for fields that are also query parameters
 */
export interface ParamConfig {
  /**
   * Convert a value into a string for storage in the URL.
   * `null` indicates the value should be omitted from the URL.
   */
  serialize: (value: unknown, instance: any) => string | null;
  /**
   * Convert a string value from the URL back into
   * its original type
   */
  deserialize: (urlValue: string, instance: any) => unknown;
  /**
   * Get the default value for this param from the given instance.
   *
   * If not present, the value passed to the field initializer
   * will be used as the default.
   *
   * This should return the value in the field's native type,
   * not the serialized URL form.
   */
  getDefault?: (instance: any) => unknown;
}

/**
 * Creates a {@link ParamConfig} for boolean fields that serialize to '1' or null.
 *
 * @returns ParamConfig for boolean fields
 *
 * @example
 * ```ts
 * @param(BooleanParam())
 * @field
 * myFlag: boolean = false;
 * ```
 */
export function BooleanParam(): ParamConfig {
  return {
    serialize: (value: unknown) => ((value as boolean) ? '1' : null),
    deserialize: (urlValue: string) => urlValue === '1',
  };
}

/**
 * Creates a {@link ParamConfig} for numeric fields with default value checking.
 *
 * @param precision - When given, the number of digits to serialize after the decimal point
 * @param getDefault - Function to get the default value for comparison
 * @returns ParamConfig for number fields
 *
 * @example
 * ```ts
 * @param(NumberParam(2, function (instance: MyClass) { return instance.defaultZoom; }))
 * @field
 * zoom: number = 12;
 * ```
 */
export function NumberParam(precision?: number, getDefault?: (instance: any) => number | undefined): ParamConfig {
  const isPrecise = typeof precision === 'number';
  return {
    serialize: function (value: unknown) {
      if (typeof value !== 'number') {
        return null;
      }
      return isPrecise ? value.toFixed(precision) : value.toString();
    },

    deserialize: (urlValue: string) => {
      const num = Number(urlValue);
      return isNaN(num) ? null : num;
    },
    getDefault: (instance: any) => {
      return getDefault?.(instance);
    },
  };
}

/**
 * Decorator which marks a field as a query parameter.
 *
 * This decorator only stores metadata - it does not change the property behavior.
 * The field will operate as a normal `@field` until a router integration consumes it.
 *
 * The provided {@link ParamConfig} is used to:
 * - Serialize values for the URL
 * - Deserialize values from the URL
 * - Compare URL and local values
 * - Determine when to include/exclude params from the URL
 *
 * @param config - Configuration for URL serialization/deserialization
 *
 * @example
 * ```ts
 * @SessionResource('map-state')
 * class MapState {
 *   @param({
 *     serialize: (value: unknown) => (value ? '1' : null),
 *     deserialize: (urlValue: string) => urlValue === '1',
 *   })
 *   @field
 *   active: boolean = false;
 * }
 * ```
 */
export function param(config: ParamConfig): PropertyDecorator {
  return function (target: object, key: string | symbol, desc?: PropertyDescriptor): void {
    assert('param decorator only supports string keys', typeof key === 'string');

    const meta = initMeta(target);

    // Initialize paramConfigs map if needed
    if (!meta.paramConfigs) {
      meta.paramConfigs = new Map();
    }
    meta.paramConfigs.set(key, config);

    return desc as unknown as void;
  };
}
