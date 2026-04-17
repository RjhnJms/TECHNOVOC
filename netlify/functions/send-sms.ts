import { Handler } from "@netlify/functions"

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  const { apikey, number, message, sendername } = JSON.parse(event.body || "{}")

  const response = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, number, message, sendername }),
  })

  const data = await response.json()
  return {
    statusCode: response.status,
    body: JSON.stringify(data),
  }
}

export { handler }