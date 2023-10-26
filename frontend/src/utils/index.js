const getConfig = () => {
  return window.appdata.config
};

const queryString = (params) => {
  return Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join("&")
}

const createUrl = (url, queryOptions) => {
  if (url === undefined) {
    url = getConfig().wwwroot + '/local/platform/service.php';
  }
  queryOptions = queryOptions || {}
  queryOptions.sesskey = getConfig().sesskey
  return url + "?" + queryString(queryOptions)
}

const fetchData = async (options, url) => {
  const defaultOptions = { 
    method: "GET", 
    body: {}, 
    query: {} 
  };
  const mergedOptions = { ...defaultOptions, ...options };

  if (! (mergedOptions.query || mergedOptions.body)) {
    throw new Error('Body or query required.'); 
  }

  const response = await fetch(createUrl(url, mergedOptions.query), {
    method: mergedOptions.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: mergedOptions.method !== "GET" ? JSON.stringify(mergedOptions.body) : null,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred.');
  }

  return data;
};

const statuses = {
  unsaved: 0,
  saved: 1,
  live: 2,
}

export { fetchData, getConfig, queryString, createUrl, statuses };