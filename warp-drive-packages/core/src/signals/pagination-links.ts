import { PaginationState } from './pagination-state.ts';

export class PaginationLinks<RT = unknown, E = unknown> {
  declare paginationState: PaginationState<RT, E>;

  constructor(paginationState: PaginationState<RT, E>) {
    this.paginationState = paginationState;
  }
}
