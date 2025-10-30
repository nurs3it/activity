import { NextRequest, NextResponse } from "next/server"

const GITLAB_URL = process.env.GITLAB_URL || ""
const GITLAB_API_TOKEN = process.env.GITLAB_API_TOKEN || ""
const GITLAB_API_VERSION = process.env.GITLAB_API_VERSION || "v4"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params
  const path = pathArray.join("/")
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)
  // Добавляем private_token как fallback для старых/жестко настроенных GitLab
  if (!searchParams.has("private_token")) {
    searchParams.set("private_token", GITLAB_API_TOKEN)
  }
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""

  const url = `${GITLAB_URL}/api/${GITLAB_API_VERSION}/${path}${queryString}`

  try {
    if (!GITLAB_URL || !GITLAB_API_TOKEN) {
      return NextResponse.json(
        { error: "GitLab proxy is not configured. Please set GITLAB_URL and GITLAB_API_TOKEN in .env.local" },
        { status: 500 }
      )
    }

    const response = await fetch(url, {
      // Avoid caching auth responses
      cache: "no-store",
      headers: {
        // Send both header styles to support different GitLab setups
        "PRIVATE-TOKEN": GITLAB_API_TOKEN,
        Authorization: `Bearer ${GITLAB_API_TOKEN}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    if (!response.ok) {
      let upstreamBody: any = null
      try {
        const text = await response.text()
        upstreamBody = text
      } catch {}
      return NextResponse.json(
        {
          error: `GitLab API error: ${response.status} ${response.statusText}`,
          upstream: upstreamBody,
          url,
          usedHeaders: {
            privateToken: Boolean(GITLAB_API_TOKEN),
            authBearer: Boolean(GITLAB_API_TOKEN),
          },
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
