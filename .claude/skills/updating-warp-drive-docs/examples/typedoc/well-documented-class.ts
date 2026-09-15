/**
 * Complete example of a well-documented class following WarpDrive TSDoc conventions.
 *
 * This file demonstrates:
 * - Proper comment structure
 * - Required tags (@since, @internal)
 * - Parameter and return documentation
 * - Markdown formatting
 * - VitePress features
 */

/**
 * Manages user records in the application
 *
 * The UserManager provides methods for creating, retrieving,
 * updating, and deleting user records. It handles caching
 * and synchronization with the backend.
 *
 * ## Usage
 *
 * ```ts
 * const manager = new UserManager(store);
 * const user = await manager.findUser('123');
 * ```
 *
 * ::: tip
 * Use the cache option for better performance when fetching
 * the same user multiple times.
 * :::
 *
 * @since 2.0.0
 * @public
 */
export class UserManager {
  /**
   * The store instance used for data operations
   *
   * @since 2.0.0
   */
  private store: Store;

  /**
   * Cache of recently accessed users
   *
   * @internal
   */
  private cache: Map<string, User>;

  /**
   * Creates a new UserManager instance
   *
   * @param store - The store to use for data operations
   * @since 2.0.0
   */
  constructor(store: Store) {
    this.store = store;
    this.cache = new Map();
  }

  /**
   * Finds a user by ID
   *
   * Retrieves a user from the cache if available, otherwise
   * fetches from the backend and updates the cache.
   *
   * ## Example
   *
   * ::: code-group
   *
   * ```ts [Basic Usage]
   * const user = await manager.findUser('123');
   * console.log(user.name);
   * ```
   *
   * ```ts [With Error Handling]
   * try {
   *   const user = await manager.findUser('123');
   *   console.log(user.name);
   * } catch (error) {
   *   console.error('User not found');
   * }
   * ```
   *
   * :::
   *
   * @param id - The unique identifier of the user
   * @param useCache - Whether to use cached data if available
   * @return Promise resolving to the user record
   * @throws {NotFoundError} If the user doesn't exist
   * @since 2.0.0
   */
  async findUser(id: string, useCache: boolean = true): Promise<User> {
    if (useCache && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const user = await this.store.findRecord('user', id);
    this.cache.set(id, user);
    return user;
  }

  /**
   * Creates a new user
   *
   * Validates the user data, creates the record in the backend,
   * and adds it to the cache.
   *
   * @param data - The user data
   * @return Promise resolving to the created user
   * @since 2.0.0
   */
  async createUser(data: UserData): Promise<User> {
    this.validateUserData(data);
    const user = await this.store.createRecord('user', data);
    this.cache.set(user.id, user);
    return user;
  }

  /**
   * Updates an existing user
   *
   * @param id - The user ID to update
   * @param data - The updated user data
   * @return Promise resolving to the updated user
   * @since 2.0.0
   */
  async updateUser(id: string, data: Partial<UserData>): Promise<User> {
    const user = await this.findUser(id);
    Object.assign(user, data);
    await user.save();
    return user;
  }

  /**
   * Deletes a user
   *
   * Removes the user from the backend and clears it from the cache.
   *
   * @param id - The user ID to delete
   * @return Promise that resolves when deletion is complete
   * @since 2.0.0
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.findUser(id);
    await user.destroy();
    this.cache.delete(id);
  }

  /**
   * Clears the user cache
   *
   * Removes all cached user records. Use this when you need
   * to force fresh data from the backend.
   *
   * @since 2.1.0
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets the number of cached users
   *
   * @return The count of users currently in cache
   * @since 2.1.0
   */
  get cacheSize(): number {
    return this.cache.size;
  }

  /**
   * Validates user data before creation or update
   *
   * @param data - The user data to validate
   * @throws {ValidationError} If data is invalid
   * @internal
   */
  private validateUserData(data: UserData): void {
    if (!data.email || !data.name) {
      throw new ValidationError('Email and name are required');
    }
  }

  /**
   * Internal method for cache management
   *
   * Removes least recently used entries when cache exceeds size limit.
   *
   * @internal
   */
  private pruneCache(): void {
    // Implementation details...
  }
}

/**
 * Configuration options for UserManager
 *
 * @since 2.0.0
 * @public
 */
export interface UserManagerOptions {
  /**
   * Maximum number of users to cache
   */
  maxCacheSize?: number;

  /**
   * Time in milliseconds before cached data expires
   */
  cacheExpiry?: number;

  /**
   * Whether to automatically prune the cache
   */
  autoPrune?: boolean;
}

/**
 * Data structure for user records
 *
 * @since 2.0.0
 * @public
 */
export interface UserData {
  /**
   * User's email address
   */
  email: string;

  /**
   * User's display name
   */
  name: string;

  /**
   * Optional avatar URL
   */
  avatar?: string;

  /**
   * User's role in the system
   */
  role: 'admin' | 'user' | 'guest';
}

/**
 * Represents a user in the system
 *
 * User instances are created by the framework and should not
 * be instantiated directly. Use {@link UserManager.findUser} or
 * {@link UserManager.createUser} instead.
 *
 * @hideconstructor
 * @since 2.0.0
 * @public
 */
export class User {
  /**
   * Unique identifier for the user
   *
   * @since 2.0.0
   */
  id: string;

  /**
   * User's email address
   *
   * @since 2.0.0
   */
  email: string;

  /**
   * User's display name
   *
   * @since 2.0.0
   */
  name: string;

  /**
   * Saves changes to the user record
   *
   * @return Promise that resolves when save is complete
   * @since 2.0.0
   */
  async save(): Promise<void> {
    // Implementation...
  }

  /**
   * Deletes the user record
   *
   * @return Promise that resolves when deletion is complete
   * @since 2.0.0
   */
  async destroy(): Promise<void> {
    // Implementation...
  }
}

/**
 * Symbol used internally to mark user records
 *
 * @internal
 */
export const USER_MARKER = Symbol('user');

/**
 * The current version of the UserManager API
 *
 * @since 2.0.0
 * @public
 */
export const API_VERSION = '2.1.0';
