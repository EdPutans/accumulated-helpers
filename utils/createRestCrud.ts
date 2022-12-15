/**
 * @description
 * A big boy helper function that eleminates some fetch boilerplate
 * by returning all basic methods for a simple REST CRUD, along with some customizability
 */

/**
 * @Limitations
 * - Currently this is not memoised at all, if used inside a react component or hook
 * - all POST body entries are optional
 */

/**
 * @future
 * support for query parameters is still 💩
 * proper error handling
 * endpoint on a per-route basis
 * add support for more ID types
 * add a shouldCatch option
 * hooks! 🦈 OR  --possibly-- convert into a class for better readability and constructor 🤷🏻‍♂️
 * more customisation to be added as time progresses 💜
 */

// Getter function type. FIXME: `any` makes me want to cry, but so does this code sometimes.
type GetterFunc<T extends unknown = any> = (resp: any) => T;

type GetterFuncPerIndividualMethod<T> = {
  getAll: GetterFunc<T[]>;
  getSingle: GetterFunc<T>;
  post: GetterFunc<T>;
  patch: GetterFunc<T>;
  put: GetterFunc<T>;
  replace: GetterFunc<T>;
  remove: GetterFunc<T>;
};

// Options
export type RestCrudOptions<T> = {
  headers?: HeadersInit;
  onError?: (err: unknown) => any;
  accessor?: GetterFunc<T> | Partial<GetterFuncPerIndividualMethod<T>>;
};

// supported Ids
type Id = string | number;

/*
 * Adds an Id to the endpoint after checking if the / is present at the end
 */
function slapIdOnTop(endpoint: string, id: Id): string {
  return endpoint.endsWith("/") ? `${endpoint}${id}` : `${endpoint}/${id}`;
}

/*
 * Adds query params to the endpoint after checking if the / is present at the end. Returns full string
 */
function slapQueryParamsOnTop(
  endpoint: string,
  queryParams?: string[]
): string {
  if (!queryParams) return endpoint;

  const sanitizedEndpoint = endpoint.endsWith("/")
    ? `${endpoint.slice(0, -1)}`
    : endpoint;
  const sanitizedQueryParams = "?" + queryParams.join("&");
  return sanitizedEndpoint + sanitizedQueryParams;
}

/*
 * If no highly sophisticated getter is provided, just return whatever is in the body
 */
function defaultDataGetter<T>(respBody: unknown): T {
  return respBody as T;
}
/**
 *
 * Default error handler, if one isn't provided
 */
function defaultOnError(err: unknown) {
  console.error(err);
}

function createRestCrud<T extends unknown = any>(
  endpoint: string,
  options: RestCrudOptions<T> = {}
) {
  /**
   * construct the correct getters, based on provided options (if they were)
   */
  function constructGetters(): GetterFuncPerIndividualMethod<T> {
    //default getters
    let getter: GetterFuncPerIndividualMethod<T> = {
      getAll: defaultDataGetter,
      getSingle: defaultDataGetter,
      post: defaultDataGetter,
      patch: defaultDataGetter,
      put: defaultDataGetter,
      replace: defaultDataGetter,
      remove: defaultDataGetter,
    };

    // if no such option provided, use the default ones: data -> data
    if (!options.accessor) return getter;

    // if a single function is provided - use everywhere
    if (typeof options.accessor === "function") {
      return {
        getAll: options.accessor as GetterFunc<T[]>, // FIXME: outlier I still need to fix
        getSingle: options.accessor,
        post: options.accessor,
        patch: options.accessor,
        replace: options.accessor,
        put: options.accessor,
        remove: options.accessor,
      };
    }

    // otherwise set them each individually
    if (options.accessor.getAll) getter.getAll = options.accessor.getAll;
    if (options.accessor.getSingle)
      getter.getSingle = options.accessor.getSingle;
    if (options.accessor.post) getter.post = options.accessor.post;
    if (options.accessor.patch) getter.patch = options.accessor.patch;
    if (options.accessor.put) getter.put = options.accessor.put;
    if (options.accessor.replace) getter.replace = options.accessor.replace;
    if (options.accessor.remove) getter.remove = options.accessor.remove;

    return getter;
  }

  const getters = constructGetters();
  const handleError = options.onError ?? defaultOnError;

  async function getAll(
    queryParams?: string[],
    callback?: (data: T[]) => any
  ): Promise<T[]> {
    const result: T[] = await fetch(slapQueryParamsOnTop(endpoint, queryParams))
      .then((r) => r.json())
      .then(getters.getAll)
      .catch(handleError);

    if (!callback) return result;
    return callback(result);
  }

  //TODO: add support for queryParams?: string[],
  async function getSingle(id: Id, callback?: (data: T) => any): Promise<T> {
    const result: T = await fetch(slapIdOnTop(endpoint, id))
      .then((r) => r.json())
      .then(getters.getSingle)
      .catch(handleError);

    if (!callback) return result;
    return callback(result);
  }

  async function post(
    body: Partial<T>,
    callback?: (data: T) => any
  ): Promise<T> {
    const result: T = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then(getters.post)
      .catch(handleError);

    if (!callback) return result;
    return callback(result);
  }

  async function edit(
    id: Id,
    body: Partial<T>,
    patchOrPut: "PUT" | "PATCH",
    callback?: (data: T) => any
  ): Promise<T> {
    const getterForEdit = patchOrPut === "PATCH" ? getters.patch : getters.put;

    const result: T = await fetch(slapIdOnTop(endpoint, id), {
      method: patchOrPut,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then(getterForEdit)
      .catch(handleError);

    if (!callback) return result;
    return callback(result);
  }

  const patch = (id: Id, body: Partial<T>, callback?: (data: T) => any) =>
    edit(id, body, "PATCH", callback);

  const put = (id: Id, body: Partial<T>, callback?: (data: T) => any) =>
    edit(id, body, "PUT", callback);

  async function remove(id: Id, callback?: (data: unknown) => any) {
    const result = await fetch(slapIdOnTop(endpoint, id), {
      method: "DELTE",
    })
      .then((r) => r.json())
      .then(getters.remove)
      .catch(handleError);

    if (!callback) return result;
    return callback(result);
  }

  return {
    getAll,
    getSingle,
    post,
    patch,
    put,
    remove,
    // aliases:
    delete: remove,
    replace: put,
  };
}

export default createRestCrud;
