import { useState } from "react"
import { createUrl } from '../utils/index'

export function useAjax() {

  const [data, setData] = useState({
    response: null,
    error: false,
    loading: false,
  })

  const ajax = async (options = { method: "GET", body: {}, query: {} }, url) => {
    if (options.query || options.body) {
      setData({ response: null, error: null, loading: true })
      fetch(createUrl(url, options.query), {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: options.method !== "GET" && JSON.stringify(options.body),
      })
      .then(async response => {
        const data = await response.json()
        setData({
          response: data,
          error: data.error,
          loading: false,
        })
      })
      .catch(error => {
        setData({
          response: error,
          error: true,
          loading: false,
        })
      })
    }
  }

  return [ data.response, data.error, data.loading, ajax, setData ];
}