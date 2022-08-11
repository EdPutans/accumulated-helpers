/**
 * @Limitation
 * Currently this is not memoised at all. I don't want to introduce React as a dependency yet.
 * This may change in the future
 */

/**
 * @Usage
 * In your React component, use the hook like this:
 * const { getAll } = useRestCrud("http://url-of-my-api-here.com/cats");
 */


export type UseRestCrudOptions = {
  headers?: HeadersInit
  // more customisation to be added?
}

type Id = string | number;

/*
* Adds an Id to the endpoint after checking if the / is present at the end
*/
function slapIdOnTop(endpoint: string, id: Id): string {
  return endpoint.endsWith('/') ? `${endpoint}${id}` : `${endpoint}/${id}`
}

/*
* Custom hook that eleminates some fetch boilerplate by returning all basic methods for a simple REST CRUD fetch config.
*/
function useRestCrud<I extends unknown = any>(
  endpoint: string,
  options: UseRestCrudOptions = {}
) {
  async function getAll(
    callback?: (data: I[]) => any
  ): Promise<I[]> {
    const result: I[] = await fetch(endpoint).then(r => r.json());

    if (!callback) return result;
    return callback(result);
  }

  async function getSingle(
    id: Id,
    callback?: (data: I) => any
  ): Promise<I> {
    const result: I = await fetch(slapIdOnTop(endpoint, id)).then(r => r.json());

    if (!callback) return result;
    return callback(result);
  }

  async function post(
    body: Partial<I>,
    callback?: (data: I) => any
  ): Promise<I> {
    const result: I = await fetch(endpoint, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body)
    }).then(r => r.json());

    if (!callback) return result;
    return callback(result);
  }

  async function edit(
    id: Id,
    body: Partial<I>,
    patchOrPut: 'PUT' | 'PATCH',
    callback?: (data: I) => any,
  ): Promise<I> {
    const result: I = await fetch(slapIdOnTop(endpoint, id), {
      method: patchOrPut,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body)
    }).then(r => r.json());

    if (!callback) return result;
    return callback(result);
  }

  const patch = (id: Id,
    body: Partial<I>,
    callback?: (data: I) => any) => edit(id, body, 'PATCH', callback);


  const replace = (id: Id,
    body: Partial<I>,
    callback?: (data: I) => any) => edit(id, body, 'PUT', callback);

  const put = replace;

  async function remove(id: Id, callback?: (data: unknown) => any) {
    const result = await fetch(slapIdOnTop(endpoint, id), { method: "DELTE" }).then(r => r.json());

    if (!callback) return result;
    return callback(result);
  }


  return {
    getAll,
    getSingle,
    post,
    patch,
    replace,
    remove,
    put,
  };
}
export default useRestCrud;

