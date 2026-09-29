import type { JSX, ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { StoreRequestInput } from "@warp-drive/core";
import { DEBUG } from "@warp-drive/core/build-config/env";
import {
  createRequestSubscription,
  type RequestLoadingState,
  type RequestState,
  type RequestSubscription,
} from "@warp-drive/core/reactive";
import type { Future } from "@warp-drive/core/request";
import {
  type AutorefreshBehaviorCombos,
  DISPOSE,
  type RequestArgs,
  signal,
  type ContentFeatures,
  type RecoveryFeatures,
  type SubscriptionArgs,
} from "@warp-drive/core/signals/-leaked";
import type { StructuredErrorDocument } from "@warp-drive/core/types/request";

import { ReactiveContext } from "./reactive-context";
// oxlint-disable-next-line no-unused-vars
import { type StoreProvider, useStore } from "./store-provider";

const IdleBlockMissingError = new Error(
  "No idle block provided for <Request> component, and no query or request was provided."
);

class ReactiveArgs<RT, E> implements SubscriptionArgs<RT, E> {
  @signal request?: Future<RT> | undefined | null;
  @signal query?: StoreRequestInput<RT> | undefined | null;
  @signal autorefresh?: AutorefreshBehaviorCombos | undefined;
  @signal autorefreshThreshold?: number | undefined;
  @signal autorefreshBehavior?: "refresh" | "reload" | "policy";
}

/**
 * The props passed to the component given as the `chrome` prop of
 * {@link Request | `<Request />`}.
 *
 * @example
 * ```tsx
 * import type { ChromeComponentProps } from "@warp-drive/react";
 *
 * function Chrome({ children, features }: ChromeComponentProps<unknown>) {
 *   return <div className={features.isRefreshing ? "is-refreshing" : ""}>{children}</div>;
 * }
 * ```
 *
 * @summary The props the React `<Request />` component passes to its `chrome` component: the rendered state,
 * the request state, and the content features.
 * @public
 */
export interface ChromeComponentProps<RT> {
  /**
   * Whichever state component `<Request />` is rendering.
   */
  children: ReactNode;
  /**
   * The {@link RequestState} of the request, or `null` while idle.
   */
  state: RequestState | null;
  /**
   * The {@link ContentFeatures} used to refresh, reload, or abort the request.
   */
  features: ContentFeatures<RT>;
}

const DefaultChrome = <RT,>({ children }: ChromeComponentProps<RT>) => {
  return <>{children}</>;
};

/**
 * The props accepted by the {@link Request | `<Request />`} component.
 *
 * `states` is required. Every other prop is optional, but either `request` or
 * `query` is needed for the component to leave the `idle` state, and a store
 * must be available via the `store` prop or a {@link StoreProvider}.
 *
 * | Prop | Type | Purpose |
 * | --- | --- | --- |
 * | `states` | {@link RequestStates} | The components to render for each state |
 * | `request` | `Future` | A request already made via `store.request` to monitor |
 * | `query` | `StoreRequestInput` | A request for the component to make and monitor |
 * | `store` | `Store` or `RequestManager` | The store to make requests with |
 * | `subscription` | `RequestSubscription` | A subscription to render in place of creating one |
 * | `autorefresh` | `boolean` or `string` | When to automatically refresh the request |
 * | `autorefreshThreshold` | `number` | How long in ms before an autorefresh happens |
 * | `autorefreshBehavior` | `'refresh'`, `'reload'` or `'policy'` | How autorefresh fetches |
 * | `chrome` | `React.FC` | A component that wraps every state's component |
 *
 * All but `states` and `chrome` are inherited from {@link RequestArgs} and
 * documented on the members below.
 *
 * @example
 * ```tsx
 * import { Request } from "@warp-drive/react";
 * import { findRecord } from "@warp-drive/utilities/json-api";
 *
 * export function UserName({ id }: { id: string }) {
 *   return (
 *     <Request
 *       query={findRecord("user", id)}
 *       autorefresh="online,interval"
 *       autorefreshThreshold={60_000}
 *       autorefreshBehavior="refresh"
 *       states={{
 *         content: ({ result }) => <>{result.data.name}</>,
 *         error: ({ error }) => <>{error.message}</>,
 *       }}
 *     />
 *   );
 * }
 * ```
 *
 * @summary The props of the React `<Request />` component: the state components, the request or query to run,
 * store, subscription, autorefresh options, and chrome.
 * @public
 */
export interface RequestProps<RT, E> extends RequestArgs<RT, E> {
  /**
   * A component that wraps whichever state component is rendered, so shared
   * UI such as a layout or a refresh indicator stays mounted as the request
   * moves between states. It renders its `children` where the state's
   * component renders, and receives the {@link ChromeComponentProps}.
   *
   * ```tsx
   * function Chrome({ children, features }: ChromeComponentProps<User>) {
   *   return <div className={features.isRefreshing ? "is-refreshing" : ""}>{children}</div>;
   * }
   *
   * <Request request={request} chrome={Chrome} states={states} />
   * ```
   */
  chrome?: React.FC<ChromeComponentProps<RT>>;

  /**
   * The components to render for each state of the request, see
   * {@link RequestStates}.
   */
  states: RequestStates<RT, E>;
}

/**
 * The components the {@link Request | `<Request />`} component renders for
 * each state of its request, passed as its `states` prop.
 *
 * `error` and `content` are required. The rest are optional:
 *
 * - `idle`: without it, the component throws while idle
 * - `loading`: without it, nothing renders while the request is in flight
 * - `cancelled`: without it, a cancelled request renders the `error` component
 *
 * @example
 * ```tsx
 * import type { RequestStates } from "@warp-drive/react";
 * import type { User } from "./schemas/user";
 *
 * const states: RequestStates<User, unknown> = {
 *   loading: () => <Spinner />,
 *   error: ({ error, features }) => <button onClick={features.retry}>{error.message}</button>,
 *   content: ({ result }) => <h1>{result.name}</h1>,
 * };
 * ```
 *
 * @summary The components the React `<Request />` component renders for its idle, loading, cancelled, error,
 * and content states.
 * @public
 */
export interface RequestStates<RT, E> {
  /**
   * The component to render when the component is idle and waiting to be given a request.
   *
   */
  idle?: React.FC<object>;

  /**
   * The component to render when the request is loading. It receives the
   * {@link RequestLoadingState}.
   *
   */
  loading?: React.FC<{ state: RequestLoadingState }>;

  /**
   * The component to render when the request was cancelled.
   *
   */
  cancelled?: React.FC<{
    /**
     * The Error the request rejected with.
     */
    error: StructuredErrorDocument<E>;
    /**
     * Utilities to assist in recovering from the error.
     */
    features: RecoveryFeatures;
  }>;

  /**
   * The component to render when the request failed.
   */
  error: React.FC<{
    /**
     * The Error the request rejected with.
     */
    error: StructuredErrorDocument<E>;
    /**
     * Utilities to assist in recovering from the error.
     */
    features: RecoveryFeatures;
  }>;

  /**
   * The component to render when the request succeeded. It receives the
   * response as `result`, and the {@link ContentFeatures} used to refresh,
   * reload, or abort the request.
   *
   */
  content: React.FC<{ result: RT; features: ContentFeatures<RT> }>;
}

/**
 * Throws the given error. Used internally to rethrow request errors that
 * are not otherwise handled by a provided error/cancelled block.
 *
 * @private
 */
export function Throw({ error }: { error: Error }): never {
  throw error;
}

/**
 * The `<Request />` component is a powerful tool for managing data fetching and
 * state in your React application. It provides a declarative approach to reactive
 * control-flow for managing requests and state in your application.
 *
 * The `<Request />` component is ideal for handling "boundaries", outside which some
 * state is still allowed to be unresolved and within which it MUST be resolved.
 *
 * See [Reactive Control Flow](/guides/the-manual/reactivity/control-flow) for how it
 * works together with the JS API.
 *
 * ## Props
 *
 * Pass a `states` object with a component for each state (see below). Then
 * pass either `request`, a request already made with `store.request`, or
 * `query`, a request for the component to make. The store comes from the
 * `store` prop, else from the nearest {@link StoreProvider}. The component
 * also accepts `subscription`, `autorefresh`, `autorefreshThreshold`,
 * `autorefreshBehavior`, and `chrome`.
 *
 * See {@link RequestProps} for the full list of props, and
 * {@link RequestStates} for the components you can pass in `states`.
 *
 * ## Request States
 *
 * `<Request />` has five states, only one of which will be active and rendered at a time.
 *
 * - `idle`: The component is waiting to be given a request to monitor
 * - `loading`: The request is in progress
 * - `error`: The request failed
 * - `content`: The request succeeded
 * - `cancelled`: The request was cancelled
 *
 * Additionally, the `content` state has a `refresh` method that can be used to
 * refresh the request in the background, which is available as a sub-state of
 * the `content` state.
 *
 * ### Example Usage
 *
 * ```tsx
 * import { Request } from "@warp-drive/react";
 * import { findRecord } from "@warp-drive/utilities/json-api";
 *
 * export function UserPreview($props: { id: string | null }) {
 *   return (
 *    <Request
 *       query={findRecord('user', $props.id)}
 *       states={{
 *         idle: () => <div>Waiting for User Selection</div>,
 *         loading: ({ state }) => <div>Loading user data...</div>,
 *         cancelled: ({ error, features }) => (
 *           <div>
 *             <p>Request Cancelled</p>
 *             <p><button onClick={features.retry}>Start Again?</button></p>
 *           </div>
 *         ),
 *         error: ({ error, features }) => (
 *           <div>
 *             <p>Error: {error.message}</p>
 *             <p><button onClick={features.retry}>Try Again?</button></p>
 *           </div>
 *         ),
 *         content: ({ result, features }) => (
 *           <div>
 *            <h2>User Details</h2>
 *            <p>ID: {result.id}</p>
 *            <p>Name: {result.name}</p>
 *          </div>
 *        ),
 *      }}
 *    />
 *   );
 * }
 *
 * ```
 *
 * @summary Component that renders idle, loading, error, cancelled, or content states for a request as it progresses,
 * with retry and refresh support.
 * @category Components
 * @public
 */
export function Request<RT, E>($props: RequestProps<RT, E>): JSX.Element {
  return (
    <ReactiveContext>
      <InternalRequest {...$props} />
    </ReactiveContext>
  );
}

function isStrictModeRender(): boolean {
  const count = useRef<number>(0);

  // in debug we need to skip every second invocation
  if (DEBUG) {
    if (count.current++ % 2 === 1) {
      return true;
    }
  }

  return false;
}

function InternalRequest<RT, E>($props: RequestProps<RT, E>): JSX.Element {
  const isStrict = isStrictModeRender();
  const store = $props.store ?? useStore();
  const Chrome = $props.chrome ?? DefaultChrome;
  const sink = useRef<RequestSubscription<RT, E> | null>(null);
  const args = useRef<SubscriptionArgs<RT, E> | null>(null);

  if (!args.current) {
    args.current = new ReactiveArgs<RT, E>();
  }
  Object.assign(args.current, $props);

  if (sink.current && (sink.current.store !== store || $props.subscription)) {
    sink.current[DISPOSE]();
    sink.current = null;
  }

  if (!sink.current && !$props.subscription) {
    sink.current = createRequestSubscription(store, args.current);
  }

  const initialized = useRef<null | {
    disposable: { [DISPOSE]: () => void } | null;
    dispose: () => void;
  }>(null);
  const effect = () => {
    if (sink.current && (!initialized.current || initialized.current.disposable !== sink.current)) {
      initialized.current = {
        disposable: sink.current,
        dispose: () => {
          sink.current?.[DISPOSE]();
          initialized.current = null;
          sink.current = null;
        },
      };
    }

    return sink.current ? initialized.current!.dispose : undefined;
  };
  let maybeEffect = effect;

  if (DEBUG) {
    if (isStrict) {
      maybeEffect = () => {
        if (initialized.current) {
          return effect();
        }
        return () => {
          // initialize our actual effect
          effect();
          // in strict mode we don't want to run the teardown
          // for the second invocation
        };
      };
    }
  }

  useEffect(maybeEffect, [sink.current]);

  const state = $props.subscription ?? sink.current!;
  const slots = $props.states;

  return (
    <Chrome state={state.isIdle ? null : state.reqState} features={state.contentFeatures}>
      {
        // prettier-ignore
        state.isIdle && slots.idle ? <slots.idle />
          : state.isIdle ? <Throw error={IdleBlockMissingError} />
          : state.reqState.isLoading ? slots.loading ? <slots.loading state={state.reqState.loadingState} /> : ''
          : state.reqState.isCancelled && slots.cancelled ? <slots.cancelled error={state.reqState.reason} features={state.errorFeatures} />
          : state.reqState.isError && slots.error ? <slots.error error={state.reqState.reason} features={state.errorFeatures} />
          : state.reqState.isSuccess ? slots.content ? <slots.content result={state.reqState.value} features={state.contentFeatures} /> : <Throw error={new Error('No content block provided for <Request> component.')} />
          : !state.reqState.isCancelled ? <Throw error={state.reqState.reason} />
          : '' // never
      }
    </Chrome>
  );
}
