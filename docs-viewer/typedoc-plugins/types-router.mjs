import { ReflectionKind } from 'typedoc';
import { MemberRouter } from 'typedoc-plugin-markdown';

/**
 * TypeDoc's default router gives every reflection kind its own output directory
 * (`interfaces/`, `type-aliases/`, ...), so a symbol's public doc URL depends on an
 * implementation detail that carries no semantic weight — whether it's declared as an
 * `interface` or a `type` alias is an author choice, and changing one to the other
 * silently moves the page and breaks every link to its old URL (see #11084). This
 * router merges both kinds into a single stable `types/` directory; every other kind
 * keeps its default directory.
 */
class TypesRouter extends MemberRouter {
  directories = new Map([
    [ReflectionKind.Class, 'classes'],
    [ReflectionKind.Interface, 'types'],
    [ReflectionKind.Enum, 'enumerations'],
    [ReflectionKind.Namespace, 'namespaces'],
    [ReflectionKind.TypeAlias, 'types'],
    [ReflectionKind.Function, 'functions'],
    [ReflectionKind.Variable, 'variables'],
    [ReflectionKind.Document, 'documents'],
  ]);
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.renderer.defineRouter('warp-drive-types', TypesRouter);
}
