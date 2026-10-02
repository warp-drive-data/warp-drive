---
releases: ["5.9"]
---
For resources defined with schemas, the abstract type of a polymorphic relationship no longer
needs a schema of its own. When a concrete type's relationship declares `as: 'abstract-pet'`,
registering that type's schema also builds the schema for `abstract-pet`. Before, resolving the
relationship threw "Expected type abstract-pet to be a valid ResourceType". If you also
register a real schema for `abstract-pet`, it's merged with the fields its implementers add, in
either order. In development, `registerResource()` throws if two schemas declare the same field
on an abstract type with different shapes. The error for a misconfigured polymorphic
relationship now points at the side that needs fixing. See
[Polymorphism](/guides/the-manual/relational-data/features/polymorphism.md).
