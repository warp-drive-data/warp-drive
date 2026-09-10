import { useMemo, useRef } from "react";
import { useReact } from "@warp-drive/diagnostic/react";
import { GraphqlRequestHandlerSpec } from "@warp-drive-internal/specs/graphql-request-handler.spec";
import { DEBUG } from "@warp-drive/core/build-config/env";
import { ReactiveContext } from "@warp-drive/react";

// React's StrictMode (enabled in development) double-invokes render, so a
// naive `countFor(...)` call inside a component body would count each
// logical render twice. This mirrors the helper used by the
// get-request-state-rendering react spec-test to only count once per real
// commit.
function useBetterMemo<T>(getValue: () => T, deps: React.DependencyList) {
  const count = useRef<{ invoked: number; last: T }>({ invoked: 0, last: null as unknown as T });

  return useMemo(() => {
    if (DEBUG) {
      if (count.current.invoked % 2 === 0) {
        count.current.last = getValue();
      }
      count.current.invoked++;
    } else {
      count.current.last = getValue();
    }

    return count.current.last;
  }, deps);
}

function CountFor({
  countFor,
  data,
  error,
}: {
  countFor: (result?: unknown, error?: unknown) => number;
  data: unknown;
  error?: unknown;
}) {
  const value = useBetterMemo(() => countFor(data, error), [data, error]);
  return <>{value}</>;
}

GraphqlRequestHandlerSpec.use(useReact(), function (b) {
  b.test("it transforms a successful graphql response into a json:api document", function (props) {
    const { request, _getRequestState, countFor } = props;

    function Component() {
      const state = _getRequestState(request);
      return (
        <>
          Count:<CountFor countFor={countFor} data={state.result} error={state.error} />
        </>
      );
    }

    return (
      <ReactiveContext>
        <Component />
      </ReactiveContext>
    );
  })

    .test(
      "it transforms a paginated graphql connection into an array of resources with pageInfo meta",
      function (props) {
        const { request, _getRequestState, countFor } = props;

        function Component() {
          const state = _getRequestState(request);
          return (
            <>
              Count:<CountFor countFor={countFor} data={state.result} error={state.error} />
            </>
          );
        }

        return (
          <ReactiveContext>
            <Component />
          </ReactiveContext>
        );
      }
    )

    .test(
      "it rejects with an aggregate error when errorPolicy is 'all' and the response contains graphql errors",
      function (props) {
        const { request, _getRequestState, countFor } = props;

        function Component() {
          const state = _getRequestState(request);
          return (
            <>
              Count:<CountFor countFor={countFor} data={state.result} error={state.error} />
            </>
          );
        }

        return (
          <ReactiveContext>
            <Component />
          </ReactiveContext>
        );
      }
    )

    .test("it collects graphql errors into response meta when errorPolicy is 'ignore'", function (props) {
      const { request, _getRequestState, countFor } = props;

      function Component() {
        const state = _getRequestState(request);
        return (
          <>
            Count:<CountFor countFor={countFor} data={state.result} error={state.error} />
          </>
        );
      }

      return (
        <ReactiveContext>
          <Component />
        </ReactiveContext>
      );
    })

    .test("it does not transform responses from non-graphql endpoints", function (props) {
      const { request, _getRequestState, countFor } = props;

      function Component() {
        const state = _getRequestState(request);
        return (
          <>
            Count:<CountFor countFor={countFor} data={state.result} error={state.error} />
          </>
        );
      }

      return (
        <ReactiveContext>
          <Component />
        </ReactiveContext>
      );
    });
});
