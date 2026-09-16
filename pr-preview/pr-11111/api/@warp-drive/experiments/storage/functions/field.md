---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/experiments/storage/functions/field.md
---

&#x20;

# &#x20;field()

## Call Signature

```ts
function field(type): PropertyDecorator;
```

Defined in: [storage/storage-resource.ts:105](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage-resource.ts#L105)

Decorator which marks a property as a field on
a LocalResource or SessionResource

The field's value will be initialized from the persisted resource data
if available, falling back to the property's default value otherwise.

Fields can be of any type that is serializable to and restorable from JSON,
but complex types (like objects or arrays) should be handled with care to avoid
unintended mutations or reactivity issues.

By default, fields are persisted in the storage type defined by the resource decorator
(@LocalResource or @SessionResource). However, you can override this behavior
by passing 'local' or 'session' as an argument to the decorator.

***

**Example:**

```ts
@LocalResource('user-settings')
class UserSettings {
  @field
  theme: 'light' | 'dark' = 'light';

  @field('session')
  sessionToken: string | null = null;
}
```

### Parameters

#### type

`"cache"` | `"local"` | `"session"`

### Returns

`PropertyDecorator`

## Call Signature

```ts
function field(
   target, 
   key, 
   descriptor?
): void;
```

Defined in: [storage/storage-resource.ts:106](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/experiments/src/storage/storage-resource.ts#L106)

Decorator which marks a property as a field on
a LocalResource or SessionResource

The field's value will be initialized from the persisted resource data
if available, falling back to the property's default value otherwise.

Fields can be of any type that is serializable to and restorable from JSON,
but complex types (like objects or arrays) should be handled with care to avoid
unintended mutations or reactivity issues.

By default, fields are persisted in the storage type defined by the resource decorator
(@LocalResource or @SessionResource). However, you can override this behavior
by passing 'local' or 'session' as an argument to the decorator.

***

**Example:**

```ts
@LocalResource('user-settings')
class UserSettings {
  @field
  theme: 'light' | 'dark' = 'light';

  @field('session')
  sessionToken: string | null = null;
}
```

### Parameters

#### target

`object`

#### key

`string`

#### descriptor?

`PropertyDescriptor`

### Returns

`void`
